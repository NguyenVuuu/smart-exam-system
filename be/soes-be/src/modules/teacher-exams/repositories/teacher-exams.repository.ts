import type { Prisma } from '@prisma/client'
import prisma from '../../../lib/prisma'
import type { ExamApprovalQuery, ExamBody, ExamsQuery } from '../validators/teacher-exams.validator'
import { createExamQuestion, deleteExamQuestions, type SnapshotInput } from './exam-question-snapshot.repository'

export const examInclude = {
  subject: { select: { id: true, code: true, name: true, departmentId: true } },
  createdBy: { select: { id: true, user: { select: { fullName: true } } } },
  reviewedBy: { select: { id: true, user: { select: { fullName: true } } } },
  sections: { orderBy: { orderIndex: 'asc' as const }, include: { _count: { select: { questions: true } } } },
  _count: { select: { examQuestions: true, schedules: true } },
}

export const examDetailInclude = {
  ...examInclude,
  examQuestions: {
    orderBy: { orderIndex: 'asc' as const },
    include: {
      options: { orderBy: { orderIndex: 'asc' as const } },
      programmingConfig: true,
      programmingTests: true,
    },
  },
}

function filters(query: ExamsQuery): Prisma.ExamWhereInput {
  return {
    ...(query.subjectId && { subjectId: query.subjectId }), ...(query.type && { type: query.type }),
    ...(query.status && { status: query.status }), ...(query.approvalStatus && { approvalStatus: query.approvalStatus }),
    ...(query.keyword && { title: { contains: query.keyword, mode: 'insensitive' } }),
  }
}

export function listOwnedExams(teacherId: string, query: ExamsQuery) {
  const where = { ...filters(query), createdById: teacherId }
  return Promise.all([
    prisma.exam.count({ where }),
    prisma.exam.findMany({
      where, include: examInclude,
      skip: (query.page - 1) * query.pageSize, take: query.pageSize,
      orderBy: { updatedAt: 'desc' },
    }),
  ])
}

export const findExam = (id: string) => prisma.exam.findUnique({ where: { id }, include: examInclude })
export const findExamDetail = (id: string) => prisma.exam.findUnique({
  where: { id }, include: examDetailInclude,
})
export const countExistingSections = (ids: string[]) => prisma.examSection.count({ where: { id: { in: ids } } })
export const findTeacherContext = (teacherId: string) => prisma.teacher.findUnique({
  where: { id: teacherId }, select: { departmentId: true, position: true, userId: true },
})
export const findSubjectInDepartment = (subjectId: string, departmentId: string) => prisma.subject.findFirst({
  where: { id: subjectId, departmentId }, select: { id: true },
})
export const findAvailableQuestions = (teacherId: string, subjectId: string, ids: string[]) => prisma.question.findMany({
  where: {
    id: { in: ids }, subjectId,
    OR: [{ ownerId: teacherId }, { questionBankItem: { status: 'APPROVED', removedAt: null } }],
  },
  include: { options: true, programmingConfig: true, programmingTests: true },
})
export const findAttemptForExtension = (id: string, teacherId: string) => prisma.examAttempt.findFirst({
  where: {
    id,
    examSchedule: {
      scheduleCourses: {
        some: {
          OR: [{ courseOffering: { teacherId } }, { proctors: { some: { teacherId } } }],
        },
      },
    },
  },
  include: { student: { include: { user: true } }, examSchedule: true },
})
export function updateAttemptDeadline(
  id: string,
  expectedDeadline: Date,
  deadlineAt: Date,
  userId: string,
  reason: string,
) {
  return prisma.$transaction(async (tx) => {
    const changed = await tx.examAttempt.updateMany({
      where: { id, status: 'IN_PROGRESS', deadlineAt: expectedDeadline }, data: { deadlineAt },
    })
    if (!changed.count) return null
    await tx.auditLog.create({
      data: {
        userId,
        action: 'EXTEND_EXAM_ATTEMPT',
        entityType: 'ExamAttempt',
        entityId: id,
        metadata: { reason, previousDeadline: expectedDeadline, newDeadline: deadlineAt },
      },
    })
    return tx.examAttempt.findUnique({
      where: { id }, select: { id: true, deadlineAt: true, status: true },
    })
  })
}
export function createExam(teacherId: string, data: ExamBody) {
  const { sections, ...exam } = data
  return prisma.exam.create({
    data: {
      ...exam, createdById: teacherId, approvalStatus: 'NOT_REQUIRED',
      sections: { create: sections.map(({ id, orderIndex, ...section }) => ({ id, orderIndex, ...section })) },
    },
    include: examInclude,
  })
}

export function updateExam(
  id: string,
  teacherId: string,
  expectedUpdatedAt: Date,
  existingSectionIds: Set<string>,
  data: ExamBody,
) {
  const { sections, ...exam } = data
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.exam.updateMany({
      where: {
        id, createdById: teacherId, status: 'DRAFT',
        approvalStatus: { not: 'PENDING' }, updatedAt: expectedUpdatedAt,
      },
      data: { ...exam, updatedAt: new Date() },
    })
    if (!claimed.count) return null

    const incomingIds = new Set(sections.map(({ id: sectionId }) => sectionId))
    const removedIds = [...existingSectionIds].filter((sectionId) => !incomingIds.has(sectionId))
    if (removedIds.length) await tx.examSection.deleteMany({ where: { id: { in: removedIds }, examId: id } })

    const retainedIds = sections.filter(({ id: sectionId }) => existingSectionIds.has(sectionId))
    for (const [index, section] of retainedIds.entries()) {
      await tx.examSection.updateMany({ where: { id: section.id, examId: id }, data: { orderIndex: -(index + 1) } })
    }
    for (const section of sections) {
      if (existingSectionIds.has(section.id)) {
        await tx.examSection.updateMany({
          where: { id: section.id, examId: id },
          data: {
            title: section.title, description: section.description, type: section.type,
            targetPoints: section.targetPoints, orderIndex: section.orderIndex,
          },
        })
      } else {
        await tx.examSection.create({ data: { ...section, examId: id } })
      }
    }
    return tx.exam.findUniqueOrThrow({ where: { id }, include: examInclude })
  })
}

export function replaceQuestions(
  examId: string,
  teacherId: string,
  expectedUpdatedAt: Date,
  questions: SnapshotInput[],
) {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.exam.updateMany({
      where: {
        id: examId, createdById: teacherId, status: 'DRAFT',
        approvalStatus: { not: 'PENDING' }, updatedAt: expectedUpdatedAt,
      },
      data: { updatedAt: new Date() },
    })
    if (!claimed.count) return null
    await deleteExamQuestions(tx, examId)
    for (const item of questions) await createExamQuestion(tx, examId, item)
    return tx.exam.findUniqueOrThrow({ where: { id: examId }, include: examInclude })
  })
}

export function listApprovals(departmentId: string, query: ExamApprovalQuery) {
  const where: Prisma.ExamWhereInput = {
    type: 'FINAL', approvalStatus: query.status, subject: { departmentId },
    ...(query.subjectId && { subjectId: query.subjectId }),
    ...(query.keyword && { title: { contains: query.keyword, mode: 'insensitive' } }),
  }
  return Promise.all([
    prisma.exam.count({ where }),
    prisma.exam.findMany({
      where, include: examInclude,
      skip: (query.page - 1) * query.pageSize, take: query.pageSize,
      orderBy: { updatedAt: 'asc' },
    }),
  ])
}
