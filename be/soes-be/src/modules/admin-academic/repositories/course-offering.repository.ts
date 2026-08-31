import prisma from '../../../lib/prisma'
import type { CourseOfferingBody, CourseOfferingQuery } from '../validators/academic.validator'

export const courseOfferingInclude = {
  semester: { select: { id: true, code: true, name: true } },
  subject: { select: { id: true, code: true, name: true, departmentId: true } },
  teacher: { select: { id: true, teacherCode: true, user: { select: { fullName: true } } } },
  _count: { select: { enrollments: true, scheduleCourses: true } },
}

export function listCourseOfferings(query: CourseOfferingQuery) {
  const where = {
    ...(query.semesterId && { semesterId: query.semesterId }),
    ...(query.subjectId && { subjectId: query.subjectId }),
    ...(query.departmentId && { subject: { departmentId: query.departmentId } }),
    ...(query.status && { status: query.status }),
    ...(query.keyword && { OR: [
      { code: { contains: query.keyword, mode: 'insensitive' as const } },
      { subject: { name: { contains: query.keyword, mode: 'insensitive' as const } } },
    ] }),
  }
  return Promise.all([
    prisma.courseOffering.count({ where }),
    prisma.courseOffering.findMany({
      where, include: courseOfferingInclude,
      skip: (query.page - 1) * query.pageSize, take: query.pageSize,
      orderBy: { code: 'asc' },
    }),
  ])
}

export const findCourseOffering = (id: string) => prisma.courseOffering.findUnique({ where: { id }, include: courseOfferingInclude })
export const findCourseOfferingByCode = (code: string) => prisma.courseOffering.findUnique({ where: { code } })
export const findCourseOfferingContext = (data: CourseOfferingBody) => Promise.all([
  prisma.semester.findUnique({ where: { id: data.semesterId } }),
  prisma.subject.findUnique({ where: { id: data.subjectId } }),
  prisma.teacher.findUnique({ where: { id: data.teacherId } }),
  findCourseOfferingByCode(data.code),
])
export const createCourseOffering = (data: CourseOfferingBody) => prisma.courseOffering.create({ data, include: courseOfferingInclude })
export const updateCourseOffering = (id: string, data: CourseOfferingBody) => prisma.courseOffering.update({ where: { id }, data, include: courseOfferingInclude })
