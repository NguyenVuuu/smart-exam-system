import prisma from '../../../lib/prisma'
import type { CourseCollectionQuery, TeacherCoursesQuery } from '../validators/teacher-courses.validator'

export const teacherCourseInclude = {
  semester: { select: { id: true, code: true, name: true } },
  subject: { select: { id: true, code: true, name: true } },
  _count: { select: { enrollments: true, materials: true, posts: true, scheduleCourses: true } },
}

export const teacherCourseDetailInclude = {
  semester: { select: { id: true, code: true, name: true } },
  subject: { select: { id: true, code: true, name: true } },
  teacher: { select: { id: true, user: { select: { fullName: true } } } },
  _count: { select: { enrollments: true, materials: true, posts: true, scheduleCourses: true } },
  materials: { orderBy: { createdAt: 'desc' as const } },
  posts: {
    include: {
      createdBy: { include: { user: { select: { fullName: true } } } },
      attachments: true,
    },
    orderBy: [{ publishedAt: 'desc' as const }, { createdAt: 'desc' as const }],
  },
}

export const proctorAssignmentSelect = {
  id: true,
  courseOffering: { select: { id: true, code: true, subject: { select: { name: true } } } },
  examSchedule: { select: { id: true, title: true, startTime: true, endTime: true, status: true, createdById: true } },
  proctors: { select: { teacherId: true } },
}

export function listTeacherCourses(teacherId: string, query: TeacherCoursesQuery) {
  const where = {
    teacherId,
    ...(query.semesterId && { semesterId: query.semesterId }),
    ...(query.subjectId && { subjectId: query.subjectId }),
    ...(query.status && { status: query.status }),
    ...(query.keyword && { OR: [
      { code: { contains: query.keyword, mode: 'insensitive' as const } },
      { subject: { name: { contains: query.keyword, mode: 'insensitive' as const } } },
    ] }),
  }
  return Promise.all([
    prisma.courseOffering.count({ where }),
    prisma.courseOffering.findMany({
      where,
      include: teacherCourseInclude,
      skip: (query.page - 1) * query.pageSize, take: query.pageSize,
      orderBy: { code: 'asc' },
    }),
  ])
}

export function findTeacherCourseDetail(teacherId: string, courseOfferingId: string) {
  return prisma.courseOffering.findFirst({
    where: { id: courseOfferingId, teacherId },
    include: teacherCourseDetailInclude,
  })
}

export async function listProctorAssignments(teacherId: string) {
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId }, select: { userId: true } })
  if (!teacher) return []
  return prisma.examScheduleCourse.findMany({
    where: {
      examSchedule: { status: { notIn: ['DRAFT', 'CANCELLED'] }, endTime: { gt: new Date() } },
      OR: [{ proctors: { some: { teacherId } } }, { examSchedule: { createdById: teacher.userId } }],
    },
    select: proctorAssignmentSelect,
    orderBy: { examSchedule: { startTime: 'asc' } },
  })
}

export function listCourseStudents(teacherId: string, courseOfferingId: string, query: CourseCollectionQuery) {
  const where = {
    courseOfferingId, courseOffering: { teacherId },
    ...(query.keyword && { student: { OR: [
      { studentCode: { contains: query.keyword, mode: 'insensitive' as const } },
      { user: { fullName: { contains: query.keyword, mode: 'insensitive' as const } } },
      { user: { email: { contains: query.keyword, mode: 'insensitive' as const } } },
    ] } }),
  }
  return Promise.all([
    prisma.enrollment.count({ where }),
    prisma.enrollment.findMany({
      where, include: { student: { include: { user: { select: { fullName: true, email: true } } } } },
      skip: (query.page - 1) * query.pageSize, take: query.pageSize,
      orderBy: { enrolledAt: 'asc' },
    }),
  ])
}

export function listCourseExams(teacherId: string, courseOfferingId: string, query: CourseCollectionQuery) {
  const where = {
    courseOfferingId, courseOffering: { teacherId },
    ...(query.keyword && { examSchedule: { exam: { title: { contains: query.keyword, mode: 'insensitive' as const } } } }),
  }
  return Promise.all([
    prisma.examScheduleCourse.count({ where }),
    prisma.examScheduleCourse.findMany({
      where,
      include: { examSchedule: { include: { exam: { select: { id: true, title: true, totalPoints: true } } } } },
      skip: (query.page - 1) * query.pageSize, take: query.pageSize,
      orderBy: { examSchedule: { startTime: 'desc' } },
    }),
  ])
}
