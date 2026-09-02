import type { Prisma } from '@prisma/client'
import prisma from '../../../lib/prisma'
import type { ExamTrackingQuery, QuestionBankQuery } from '../validators/admin-content.validator'

export const bankInclude = {
  question: { include: {
    subject: { select: { id: true, code: true, name: true, departmentId: true } },
    owner: { select: { id: true, user: { select: { fullName: true } } } },
    options: { orderBy: { orderIndex: 'asc' as const } }, programmingConfig: true,
    programmingTests: { orderBy: { orderIndex: 'asc' as const } },
  } },
  reviewedByTeacher: { select: { id: true, user: { select: { fullName: true } } } },
  removedByTeacher: { select: { user: { select: { fullName: true } } } },
  removedByAdmin: { select: { user: { select: { fullName: true } } } },
}

export const trackedExamInclude = {
  subject: { select: { id: true, code: true, name: true, departmentId: true } },
  semester: { select: { id: true, code: true, name: true, status: true } },
  createdBy: { select: { id: true, user: { select: { fullName: true } } } },
  reviewedBy: { select: { id: true, user: { select: { fullName: true } } } },
  _count: { select: { examQuestions: true, schedules: true } },
}

export async function adminActor(userId: string) {
  return prisma.admin.findUnique({ where: { userId }, select: { id: true } })
}

export function listBank(query: QuestionBankQuery) {
  const where: Prisma.QuestionBankItemWhereInput = {
    status: 'APPROVED',
    ...(query.status === 'APPROVED' && { removedAt: null }),
    ...(query.status === 'REMOVED' && { removedAt: { not: null } }),
    question: {
      ...(query.subjectId && { subjectId: query.subjectId }),
      ...(query.departmentId && { subject: { departmentId: query.departmentId } }),
      ...(query.keyword && { OR: [
        { title: { contains: query.keyword, mode: 'insensitive' } },
        { content: { contains: query.keyword, mode: 'insensitive' } },
        { owner: { user: { fullName: { contains: query.keyword, mode: 'insensitive' } } } },
        { subject: { name: { contains: query.keyword, mode: 'insensitive' } } },
      ] }),
    },
  }
  return Promise.all([
    prisma.questionBankItem.count({ where }),
    prisma.questionBankItem.findMany({
      where, include: bankInclude, skip: (query.page - 1) * query.pageSize,
      take: query.pageSize, orderBy: { reviewedAt: 'desc' },
    }),
  ])
}

export function findBankItem(id: string) {
  return prisma.questionBankItem.findUnique({ where: { id }, include: bankInclude })
}

export function listExams(query: ExamTrackingQuery) {
  const where: Prisma.ExamWhereInput = {
    ...(query.type && { type: query.type }), ...(query.status && { status: query.status }),
    ...(query.approvalStatus && { approvalStatus: query.approvalStatus }),
    ...(query.subjectId && { subjectId: query.subjectId }),
    ...(query.semesterId && { semesterId: query.semesterId }),
    ...(query.departmentId && { subject: { departmentId: query.departmentId } }),
    ...(query.keyword && { OR: [
      { title: { contains: query.keyword, mode: 'insensitive' } },
      { subject: { name: { contains: query.keyword, mode: 'insensitive' } } },
      { createdBy: { user: { fullName: { contains: query.keyword, mode: 'insensitive' } } } },
    ] }),
  }
  return Promise.all([
    prisma.exam.count({ where }),
    prisma.exam.findMany({
      where, include: trackedExamInclude, skip: (query.page - 1) * query.pageSize,
      take: query.pageSize, orderBy: { updatedAt: 'desc' },
    }),
  ])
}
