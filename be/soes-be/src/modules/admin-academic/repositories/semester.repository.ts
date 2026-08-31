import prisma from '../../../lib/prisma'
import type { SemesterBody, SemesterQuery } from '../validators/academic.validator'

export const semesterInclude = { _count: { select: { courseOfferings: true } } }

export function listSemesters(query: SemesterQuery) {
  const where = {
    ...(query.status && { status: query.status }),
    ...(query.academicYear && { academicYear: query.academicYear }),
    ...(query.keyword && {
      OR: [
        { code: { contains: query.keyword, mode: 'insensitive' as const } },
        { name: { contains: query.keyword, mode: 'insensitive' as const } },
      ],
    }),
  }
  return Promise.all([
    prisma.semester.count({ where }),
    prisma.semester.findMany({
      where,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: [{ academicYear: 'desc' }, { term: 'asc' }],
      include: semesterInclude,
    }),
  ])
}

export const findSemester = (id: string) => prisma.semester.findUnique({ where: { id } })
export const findSemesterByCode = (code: string) => prisma.semester.findUnique({ where: { code } })

export function createSemester(code: string, name: string, data: SemesterBody) {
  return prisma.semester.create({ data: { ...data, code, name }, include: semesterInclude })
}

export function updateSemester(id: string, data: SemesterBody, code: string, name: string) {
  return prisma.semester.update({ where: { id }, data: { ...data, code, name }, include: semesterInclude })
}

export function activateSemester(id: string) {
  return prisma.$transaction(async (tx) => {
    const previous = await tx.semester.findMany({
      where: { status: 'ACTIVE', id: { not: id } },
      select: { id: true },
    })
    const previousIds = previous.map(({ id: semesterId }) => semesterId)
    if (previousIds.length) {
      await tx.courseOffering.updateMany({
        where: { semesterId: { in: previousIds }, status: 'ACTIVE' },
        data: { status: 'CLOSED' },
      })
      await tx.semester.updateMany({
        where: { id: { in: previousIds } },
        data: { status: 'CLOSED' },
      })
    }
    return tx.semester.update({ where: { id }, data: { status: 'ACTIVE' }, include: semesterInclude })
  })
}
