import prisma from '../../../lib/prisma'
import type { SubjectBody, SubjectQuery } from '../validators/academic.validator'

export const subjectInclude = {
  department: { select: { id: true, code: true, name: true } },
  _count: { select: { courseOfferings: true } },
}

export function listSubjects(query: SubjectQuery) {
  const where = {
    ...(query.departmentId && { departmentId: query.departmentId }),
    ...(query.status && { status: query.status }),
    ...(query.keyword && { OR: [
      { code: { contains: query.keyword, mode: 'insensitive' as const } },
      { name: { contains: query.keyword, mode: 'insensitive' as const } },
    ] }),
  }
  return Promise.all([
    prisma.subject.count({ where }),
    prisma.subject.findMany({
      where,
      include: subjectInclude,
      skip: (query.page - 1) * query.pageSize, take: query.pageSize,
      orderBy: { code: 'asc' },
    }),
  ])
}

export const findSubject = (id: string) => prisma.subject.findUnique({ where: { id } })
export const findSubjectByCode = (code: string) => prisma.subject.findUnique({ where: { code } })
export const createSubject = (data: SubjectBody) => prisma.subject.create({ data, include: subjectInclude })
export const updateSubject = (id: string, data: SubjectBody) => prisma.subject.update({ where: { id }, data, include: subjectInclude })
