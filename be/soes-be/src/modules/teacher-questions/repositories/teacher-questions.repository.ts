import type { Prisma } from '@prisma/client'
import prisma from '../../../lib/prisma'
import type { ApprovalQuery, QuestionBody, QuestionsQuery } from '../validators/teacher-questions.validator'

export const questionInclude = {
  subject: { select: { id: true, code: true, name: true, departmentId: true } },
  owner: { select: { id: true, user: { select: { fullName: true } } } },
  options: { orderBy: { orderIndex: 'asc' as const } },
  programmingConfig: true,
  programmingTests: { orderBy: { orderIndex: 'asc' as const } },
  questionBankItem: {
    select: {
      id: true,
      status: true,
      rejectionReason: true,
      removedAt: true,
      reviewedAt: true,
      removalReason: true,
      removedByTeacher: { select: { user: { select: { fullName: true } } } },
      removedByAdmin: { select: { user: { select: { fullName: true } } } },
    },
  },
}

export const approvalInclude = { question: { include: questionInclude } }

export async function teacherDepartment(teacherId: string) {
  return prisma.teacher.findUnique({
    where: { id: teacherId }, select: { departmentId: true, position: true, userId: true },
  })
}

export const findSubjectInDepartment = (subjectId: string, departmentId: string) => prisma.subject.findFirst({
  where: { id: subjectId, departmentId }, select: { id: true },
})
export const listActiveSubjects = (departmentId: string) => prisma.subject.findMany({
  where: { departmentId, status: 'ACTIVE' },
  select: { id: true, code: true, name: true },
  orderBy: { name: 'asc' },
})

const optionsWithOrder = (options: QuestionBody['options']) =>
  options.map((option, index) => ({ ...option, orderIndex: index }))

function questionFilters(query: QuestionsQuery): Prisma.QuestionWhereInput {
  return {
    ...(query.subjectId && { subjectId: query.subjectId }),
    ...(query.type && { type: query.type }),
    ...(query.difficulty && { difficulty: query.difficulty }),
    ...(query.keyword && { OR: [
      { title: { contains: query.keyword, mode: 'insensitive' } },
      { content: { contains: query.keyword, mode: 'insensitive' } },
    ] }),
  }
}

export async function listQuestions(teacherId: string, departmentId: string, query: QuestionsQuery) {
  const where: Prisma.QuestionWhereInput = query.scope === 'PERSONAL'
    ? {
        ...questionFilters(query), ownerId: teacherId,
        archivedAt: query.archived ? { not: null } : null,
        ...(query.approvalStatus && { questionBankItem: { status: query.approvalStatus } }),
      }
    : {
        ...questionFilters(query), subject: { departmentId },
        questionBankItem: { status: 'APPROVED', removedAt: null },
      }
  return Promise.all([
    prisma.question.count({ where }),
    prisma.question.findMany({
      where, include: questionInclude,
      skip: (query.page - 1) * query.pageSize, take: query.pageSize,
      orderBy: { updatedAt: 'desc' },
    }),
  ])
}

export const findOwnedQuestion = (id: string, ownerId: string) => prisma.question.findFirst({ where: { id, ownerId }, include: questionInclude })

export async function setArchived(
  id: string,
  ownerId: string,
  expectedUpdatedAt: Date,
  archived: boolean,
) {
  const changed = await prisma.question.updateMany({
    where: { id, ownerId, updatedAt: expectedUpdatedAt },
    data: { archivedAt: archived ? new Date() : null, updatedAt: new Date() },
  })
  return changed.count ? findOwnedQuestion(id, ownerId) : null
}

export function createQuestion(ownerId: string, data: QuestionBody) {
  const { options, testCases, timeLimitMs, memoryLimitMb, maxCodeSizeKb, ...question } = data
  const programming = question.type === 'PROGRAMMING'
  return prisma.question.create({
    data: {
      ...question, ownerId, source: 'MANUAL',
      options: { create: optionsWithOrder(options) },
      ...(programming && {
        programmingConfig: { create: {
          timeLimitMs, memoryLimitKb: memoryLimitMb && memoryLimitMb * 1024, maxCodeSizeKb,
        } },
        programmingTests: { create: testCases.map((test, index) => ({
          ...test, isSample: !test.isHidden, orderIndex: index + 1,
        })) },
      }),
    },
    include: questionInclude,
  })
}

export function updateQuestion(
  id: string,
  ownerId: string,
  expectedUpdatedAt: Date,
  data: QuestionBody,
  autoApprove: boolean,
) {
  const { options, testCases, timeLimitMs, memoryLimitMb, maxCodeSizeKb, ...question } = data
  const programming = question.type === 'PROGRAMMING'
  return prisma.$transaction(async (tx) => {
    const changed = await tx.question.updateMany({
      where: { id, ownerId, updatedAt: expectedUpdatedAt }, data: { updatedAt: new Date() },
    })
    if (!changed.count) return null
    await tx.questionOption.deleteMany({ where: { questionId: id } })
    await tx.questionProgrammingTestCase.deleteMany({ where: { questionId: id } })
    await tx.questionProgrammingConfig.deleteMany({ where: { questionId: id } })

    const sharedItem = await tx.questionBankItem.findUnique({
      where: { questionId: id },
      select: { id: true, status: true, removedAt: true },
    })
    if (sharedItem && !sharedItem.removedAt && ['PENDING', 'APPROVED'].includes(sharedItem.status)) {
      const bank = await tx.questionBank.upsert({
        where: { subjectId: data.subjectId },
        update: {},
        create: { subjectId: data.subjectId },
      })
      await tx.questionBankItem.update({
        where: { id: sharedItem.id },
        data: {
          questionBankId: bank.id,
          status: autoApprove ? 'APPROVED' : 'PENDING',
          reviewedAt: autoApprove ? new Date() : null,
          reviewedByTeacherId: autoApprove ? ownerId : null,
          reviewedById: null,
          rejectionReason: null,
        },
      })
    }

    return tx.question.update({
      where: { id }, data: {
        ...question, options: { create: optionsWithOrder(options) },
        ...(programming && {
          programmingConfig: { create: {
            timeLimitMs, memoryLimitKb: memoryLimitMb && memoryLimitMb * 1024, maxCodeSizeKb,
          } },
          programmingTests: { create: testCases.map((test, index) => ({
            ...test, isSample: !test.isHidden, orderIndex: index + 1,
          })) },
        }),
      }, include: questionInclude,
    })
  })
}

export function submitToSharedBank(
  questionId: string,
  subjectId: string,
  actorUserId: string,
  autoApprove?: { reviewedByTeacherId: string; reviewedAt: Date },
) {
  return prisma.$transaction(async (tx) => {
    await tx.question.update({ where: { id: questionId }, data: { updatedAt: new Date() } })
    const bank = await tx.questionBank.upsert({
      where: { subjectId }, update: {}, create: { subjectId },
    })
    const item = await tx.questionBankItem.upsert({
      where: { questionId },
      create: {
        questionId,
        questionBankId: bank.id,
        status: autoApprove ? 'APPROVED' : 'PENDING',
        reviewedByTeacherId: autoApprove?.reviewedByTeacherId ?? null,
        reviewedAt: autoApprove?.reviewedAt ?? null,
      },
      update: {
        questionBankId: bank.id,
        status: autoApprove ? 'APPROVED' : 'PENDING',
        removedAt: null,
        removedByTeacherId: null,
        removalReason: null,
        reviewedAt: autoApprove?.reviewedAt ?? null,
        reviewedById: null,
        reviewedByTeacherId: autoApprove?.reviewedByTeacherId ?? null,
        rejectionReason: null,
      },
    })
    await tx.auditLog.create({
      data: {
        userId: actorUserId,
        action: autoApprove ? 'AUTO_APPROVE_SHARED_QUESTION' : 'SUBMIT_SHARED_QUESTION',
        entityType: 'QuestionBankItem',
        entityId: item.id,
      },
    })
    return item
  })
}

export function listApprovals(departmentId: string, query: ApprovalQuery) {
  const where: Prisma.QuestionBankItemWhereInput = {
    status: query.status,
    question: {
      subject: { departmentId },
      ...(query.subjectId && { subjectId: query.subjectId }),
      ...(query.keyword && { OR: [
        { title: { contains: query.keyword, mode: 'insensitive' } },
        { content: { contains: query.keyword, mode: 'insensitive' } },
      ] }),
    },
  }
  return Promise.all([
    prisma.questionBankItem.count({ where }),
    prisma.questionBankItem.findMany({
      where,
      include: approvalInclude,
      skip: (query.page - 1) * query.pageSize, take: query.pageSize,
      orderBy: { addedAt: 'asc' },
    }),
  ])
}

export const findBankItem = (id: string) => prisma.questionBankItem.findUnique({
  where: { id }, include: { question: { select: { ownerId: true, subject: { select: { departmentId: true } } } } },
})

export function reviewBankItem(
  id: string,
  reviewerId: string,
  actorUserId: string,
  approved: boolean,
  reason?: string,
) {
  return prisma.$transaction(async (tx) => {
    const result = await tx.questionBankItem.updateMany({
      where: { id, status: 'PENDING' },
      data: {
        status: approved ? 'APPROVED' : 'REJECTED', reviewedByTeacherId: reviewerId,
        reviewedAt: new Date(), rejectionReason: approved ? null : reason,
      },
    })
    if (!result.count) return false
    await tx.auditLog.create({ data: {
      userId: actorUserId, action: approved ? 'APPROVE_SHARED_QUESTION' : 'REJECT_SHARED_QUESTION',
      entityType: 'QuestionBankItem', entityId: id, metadata: reason ? { reason } : undefined,
    } })
    return true
  })
}

export function removeBankItem(id: string, teacherId: string, actorUserId: string, reason: string) {
  return prisma.$transaction(async (tx) => {
    const result = await tx.questionBankItem.updateMany({
      where: { id, status: 'APPROVED', removedAt: null },
      data: { removedAt: new Date(), removedByTeacherId: teacherId, removalReason: reason },
    })
    if (!result.count) return false
    await tx.auditLog.create({ data: {
      userId: actorUserId, action: 'REMOVE_SHARED_QUESTION', entityType: 'QuestionBankItem',
      entityId: id, metadata: { reason },
    } })
    return true
  })
}
