import prisma from '../../../lib/prisma'
import type { Prisma } from '@prisma/client'
import type { CourseCollectionQuery, TeacherCoursesQuery } from '../validators/teacher-courses.validator'

export const teacherCourseInclude = {
  semester: { select: { id: true, code: true, name: true, status: true } },
  subject: { select: { id: true, code: true, name: true } },
  _count: { select: { enrollments: true, materials: true, posts: true, scheduleCourses: true } },
}

export const teacherCourseDetailInclude = {
  semester: { select: { id: true, code: true, name: true, status: true } },
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

export function listSemesterOptions() {
  return prisma.semester.findMany({
    select: { id: true, code: true, name: true, status: true },
    orderBy: { startDate: 'desc' },
  })
}

export function findTeacherCourseDetail(teacherId: string, courseOfferingId: string) {
  return prisma.courseOffering.findFirst({
    where: { id: courseOfferingId, teacherId },
    include: teacherCourseDetailInclude,
  })
}

export async function listProctorAssignments(teacherId: string) {
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId }, select: { userId: true } })
  if (!teacher) return { rows: [], teacherUserId: null }
  const rows = await prisma.examScheduleCourse.findMany({
    where: {
      examSchedule: { status: { notIn: ['DRAFT', 'CANCELLED'] } },
      OR: [{ proctors: { some: { teacherId } } }, { examSchedule: { createdById: teacher.userId } }],
    },
    select: proctorAssignmentSelect,
    orderBy: { examSchedule: { startTime: 'asc' } },
  })
  return { rows, teacherUserId: teacher.userId }
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

export async function getCourseGradebook(
  teacherId: string,
  courseOfferingId: string,
  query: CourseCollectionQuery,
) {
  const course = await prisma.courseOffering.findFirst({
    where: { id: courseOfferingId, teacherId }, select: { id: true },
  })
  if (!course) return null
  const enrollmentWhere = {
    courseOfferingId,
    ...(query.keyword && { student: { OR: [
      { studentCode: { contains: query.keyword, mode: 'insensitive' as const } },
      { user: { fullName: { contains: query.keyword, mode: 'insensitive' as const } } },
    ] } }),
  }
  const [total, enrollments, schedules] = await Promise.all([
    prisma.enrollment.count({ where: enrollmentWhere }),
    prisma.enrollment.findMany({
      where: enrollmentWhere,
      include: { student: { include: { user: { select: { fullName: true } } } } },
      skip: (query.page - 1) * query.pageSize, take: query.pageSize,
      orderBy: { student: { studentCode: 'asc' } },
    }),
    prisma.examSchedule.findMany({
      where: { scheduleCourses: { some: { courseOfferingId } }, status: { not: 'CANCELLED' } },
      select: {
        id: true, title: true, resultsPublishedAt: true,
        exam: { select: { type: true, totalPoints: true } },
      },
      orderBy: { startTime: 'asc' },
    }),
  ])
  const studentIds = enrollments.map(({ studentId }) => studentId)
  const attempts = studentIds.length ? await prisma.examAttempt.findMany({
    where: {
      courseOfferingId, studentId: { in: studentIds },
      status: { in: ['SUBMITTED', 'AUTO_SUBMITTED', 'GRADING', 'GRADED', 'PUBLISHED'] },
    },
    select: { studentId: true, examScheduleId: true, totalScore: true, attemptNo: true },
    orderBy: { attemptNo: 'desc' },
  }) : []
  return { total, enrollments, schedules, attempts }
}

export function findTeacherCourseScope(teacherId: string, courseOfferingId: string) {
  return prisma.courseOffering.findFirst({
    where: { id: courseOfferingId, teacherId },
    select: { id: true, subjectId: true },
  })
}

export function findCourseMaterialsByNames(courseOfferingId: string, fileNames: string[]) {
  return prisma.material.findMany({
    where: { courseOfferingId, fileName: { in: fileNames } },
    select: { fileName: true },
  })
}

export function createCourseMaterials(data: Prisma.MaterialUncheckedCreateInput[]) {
  return prisma.$transaction(data.map((material) => prisma.material.create({ data: material })))
}

export function findTeacherCourseMaterial(teacherId: string, courseOfferingId: string, materialId: string) {
  return prisma.material.findFirst({
    where: { id: materialId, courseOfferingId, courseOffering: { teacherId } },
    select: {
      id: true,
      fileName: true,
      contentType: true,
      storagePath: true,
      storageProvider: true,
    },
  })
}

export function deleteCourseMaterial(materialId: string) {
  return prisma.$transaction([
    prisma.aIGenerationMaterial.deleteMany({ where: { materialId } }),
    prisma.material.delete({ where: { id: materialId } }),
  ])
}

export function updateCourseMaterialAiEnabled(
  teacherId: string,
  courseOfferingId: string,
  materialId: string,
  aiEnabled: boolean,
) {
  return prisma.material.updateMany({
    where: { id: materialId, courseOfferingId, courseOffering: { teacherId } },
    data: { aiEnabled },
  })
}
