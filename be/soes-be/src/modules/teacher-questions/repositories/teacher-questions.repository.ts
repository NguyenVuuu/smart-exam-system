import type { Prisma } from '@prisma/client'
import prisma from '../../../lib/prisma'
import type { ApprovalQuery, QuestionBody, QuestionsQuery } from '../validators/teacher-questions.validator'
import { writeAuditLog } from '../../audit-logs/audit-log.writer'
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../../errors/AppError'
import { runSerializable } from '../../../utils/transaction'

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

export const questionAuditSelect = {
  id: true,
  title: true,
  content: true,
  explanation: true,
  type: true,
  language: true,
  subject: { select: { name: true } },
  options: { select: { content: true, isCorrect: true } },
  programmingConfig: {
    select: { timeLimitMs: true, memoryLimitKb: true, maxCodeSizeKb: true },
  },
  programmingTests: {
    select: { input: true, expectedOutput: true, isHidden: true },
  },
} satisfies Prisma.QuestionSelect

export type QuestionAuditCandidate = Prisma.QuestionGetPayload<{
  select: typeof questionAuditSelect
}>

export async function teacherDepartment(teacherId: string) {
  return prisma.teacher.findUnique({
    where: { id: teacherId }, select: { departmentId: true, position: true, userId: true },
  })
}

export async function reviewerDepartment(teacherId: string) {
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: {
      departmentId: true, status: true,
      user: { select: { status: true } },
      department: { select: {
        status: true,
        reviewGroup: { select: {
          status: true,
          members: { where: { teacherId, status: 'ACTIVE' }, select: { id: true } },
        } },
      } },
    },
  })
  if (teacher?.status !== 'ACTIVE' || teacher.user.status !== 'ACTIVE'
    || teacher.department?.status !== 'ACTIVE'
    || teacher.department.reviewGroup?.status !== 'ACTIVE'
    || !teacher.department.reviewGroup.members.length) return null
  return teacher.departmentId
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

export const listQuestionAuditCandidates = (teacherId: string) => prisma.question.findMany({
  where: { ownerId: teacherId, archivedAt: null },
  select: questionAuditSelect,
  orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
})

export const listOwnedQuestionsByIds = (teacherId: string, ids: string[]) =>
  prisma.question.findMany({
    where: { ownerId: teacherId, id: { in: ids } },
    include: questionInclude,
  })

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
      throw new ConflictError('Pending or approved shared questions cannot be edited')
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
  teacherId: string,
) {
  return runSerializable(async (tx) => {
    const author = await tx.teacher.findUnique({
      where: { id: teacherId },
      select: { departmentId: true, status: true, userId: true, user: { select: { status: true } } },
    })
    if (!author || author.status !== 'ACTIVE' || author.user.status !== 'ACTIVE' || author.userId !== actorUserId) {
      throw new ForbiddenError('Active teacher account required')
    }
    const question = await tx.question.findUnique({
      where: { id: questionId },
      select: { ownerId: true, archivedAt: true, subjectId: true, subject: { select: { departmentId: true, department: { select: { status: true, reviewGroup: { select: { id: true, status: true } } } } } }, questionBankItem: { select: { status: true, removedAt: true } } },
    })
    if (!question || question.ownerId !== teacherId || question.subjectId !== subjectId || question.subject.departmentId !== author.departmentId) {
      throw new NotFoundError('Question not found')
    }
    if (question.archivedAt) throw new ConflictError('Archived question cannot be submitted')
    if (question.questionBankItem && !question.questionBankItem.removedAt && ['PENDING', 'APPROVED'].includes(question.questionBankItem.status)) {
      throw new ConflictError('Question is already pending or approved')
    }
    const group = question.subject.department.reviewGroup
    if (question.subject.department.status !== 'ACTIVE' || group?.status !== 'ACTIVE') {
      throw new ConflictError('An active department review group is required')
    }
    const eligible = await tx.departmentReviewMember.count({
      where: { groupId: group.id, status: 'ACTIVE', teacher: { departmentId: question.subject.departmentId, status: 'ACTIVE', user: { status: 'ACTIVE' } } },
    })
    if (!eligible) throw new ConflictError('Review group has no active members')
    await tx.question.update({ where: { id: questionId }, data: { updatedAt: new Date() } })
    const bank = await tx.questionBank.upsert({
      where: { subjectId }, update: {}, create: { subjectId },
    })
    const item = await tx.questionBankItem.upsert({
      where: { questionId },
      create: {
        questionId,
        questionBankId: bank.id,
        status: 'PENDING',
      },
      update: {
        questionBankId: bank.id,
        status: 'PENDING',
        removedAt: null,
        removedByTeacherId: null,
        removalReason: null,
        reviewedAt: null,
        reviewedById: null,
        reviewedByTeacherId: null,
        rejectionReason: null,
      },
    })
    await writeAuditLog(tx, {
      userId: actorUserId,
      action: 'SUBMIT_SHARED_QUESTION',
      entityType: 'QuestionBankItem',
      entityId: item.id,
    })
    return item
  })
}

export function listApprovals(departmentId: string, query: ApprovalQuery) {
  const where: Prisma.QuestionBankItemWhereInput = {
    status: query.status,
    removedAt: null,
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
  approved: boolean,
  reason?: string,
) {
  return runSerializable(async (tx) => {
    if (!approved && !reason?.trim()) throw new ValidationError('Revision reason is required')
    const reviewer = await tx.teacher.findUnique({
      where: { id: reviewerId },
      select: { departmentId: true, status: true, userId: true, user: { select: { status: true } } },
    })
    if (!reviewer || reviewer.status !== 'ACTIVE' || reviewer.user.status !== 'ACTIVE' || !reviewer.departmentId) {
      throw new ForbiddenError('Active review group membership required')
    }
    const item = await tx.questionBankItem.findUnique({
      where: { id },
      select: { status: true, removedAt: true, question: { select: { subject: { select: { departmentId: true, department: { select: { status: true, reviewGroup: { select: { id: true, status: true } } } } } } } } },
    })
    if (!item || item.question.subject.departmentId !== reviewer.departmentId) throw new NotFoundError('Approval request not found')
    const group = item.question.subject.department.reviewGroup
    if (item.question.subject.department.status !== 'ACTIVE' || group?.status !== 'ACTIVE') {
      throw new ForbiddenError('Active review group membership required')
    }
    const membership = await tx.departmentReviewMember.findUnique({
      where: { groupId_teacherId: { groupId: group.id, teacherId: reviewerId } }, select: { status: true },
    })
    if (membership?.status !== 'ACTIVE') throw new ForbiddenError('Active review group membership required')
    if (item.status !== 'PENDING' || item.removedAt) throw new ConflictError('Approval request has already been reviewed')
    const result = await tx.questionBankItem.updateMany({
      where: { id, status: 'PENDING', removedAt: null },
      data: {
        status: approved ? 'APPROVED' : 'REJECTED', reviewedByTeacherId: reviewerId,
        reviewedAt: new Date(), rejectionReason: approved ? null : reason,
      },
    })
    if (!result.count) throw new ConflictError('Approval request has already been reviewed')
    await writeAuditLog(tx, {
      userId: reviewer.userId, action: approved ? 'APPROVE_SHARED_QUESTION' : 'REJECT_SHARED_QUESTION',
      entityType: 'QuestionBankItem', entityId: id, metadata: reason ? { reason } : undefined,
    })
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
    await writeAuditLog(tx, {
      userId: actorUserId, action: 'REMOVE_SHARED_QUESTION', entityType: 'QuestionBankItem',
      entityId: id, metadata: { reason },
    })
    return true
  })
}
