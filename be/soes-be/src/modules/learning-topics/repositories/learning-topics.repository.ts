import prisma from '../../../lib/prisma'
import { runSerializable } from '../../../utils/transaction'
import type { CreateTopicInput } from '../validators/learning-topics.validator'

export const findTeacher = (teacherId: string) => prisma.teacher.findUnique({
  where: { id: teacherId },
  select: { departmentId: true, status: true, user: { select: { status: true } } },
})

export const findSubject = (subjectId: string, departmentId: string) => prisma.subject.findFirst({
  where: { id: subjectId, departmentId, status: 'ACTIVE' }, select: { id: true },
})

export const listTopics = (subjectId: string) => prisma.learningTopic.findMany({
  where: { subjectId }, select: { id: true, code: true, name: true }, orderBy: { code: 'asc' },
})

export const createTopic = (subjectId: string, input: CreateTopicInput) => prisma.learningTopic.create({
  data: { subjectId, ...input }, select: { id: true, code: true, name: true },
})

export async function assignQuestionTopics(questionId: string, teacherId: string, topicIds: string[]) {
  return runSerializable(async (tx) => {
    const question = await tx.question.findFirst({
      where: { id: questionId, ownerId: teacherId, archivedAt: null },
      select: { id: true, subjectId: true, questionBankItem: { select: { status: true, removedAt: true } } },
    })
    if (!question) return { status: 'NOT_FOUND' as const }
    const bank = question.questionBankItem
    if (bank && !bank.removedAt && (bank.status === 'APPROVED' || bank.status === 'PENDING')) {
      return { status: 'LOCKED' as const }
    }
    const validTopics = await tx.learningTopic.findMany({
      where: { id: { in: topicIds }, subjectId: question.subjectId }, select: { id: true },
    })
    if (validTopics.length !== topicIds.length) return { status: 'INVALID' as const }
    await tx.questionTopic.deleteMany({ where: { questionId } })
    if (topicIds.length) await tx.questionTopic.createMany({
      data: topicIds.map((topicId) => ({ questionId, topicId })),
    })
    await tx.question.update({ where: { id: questionId }, data: { updatedAt: new Date() } })
    return { status: 'OK' as const, topicIds }
  })
}
