import prisma from '../../../lib/prisma'
import { runSerializable } from '../../../utils/transaction'
import { writeAuditLog } from '../../audit-logs/audit-log.writer'
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

export async function assignQuestionTopics(questionId: string, teacherId: string, userId: string, topicIds: string[]) {
  return runSerializable(async (tx) => {
    const question = await tx.question.findFirst({
      where: { id: questionId, ownerId: teacherId, archivedAt: null },
      select: { id: true, subjectId: true, topics: { select: { topicId: true } } },
    })
    if (!question) return { status: 'NOT_FOUND' as const }
    const validTopics = await tx.learningTopic.findMany({
      where: { id: { in: topicIds }, subjectId: question.subjectId }, select: { id: true },
    })
    if (validTopics.length !== topicIds.length) return { status: 'INVALID' as const }
    const previousTopicIds = question.topics.map(({ topicId }) => topicId)
    if (previousTopicIds.length === topicIds.length && previousTopicIds.every((id) => topicIds.includes(id))) {
      return { status: 'OK' as const, topicIds }
    }
    await tx.questionTopic.deleteMany({ where: { questionId } })
    if (topicIds.length) await tx.questionTopic.createMany({
      data: topicIds.map((topicId) => ({ questionId, topicId })),
    })
    await tx.question.update({ where: { id: questionId }, data: { updatedAt: new Date() } })
    await writeAuditLog(tx, { userId, action: 'UPDATE_QUESTION_TOPICS', entityType: 'Question', entityId: questionId,
      metadata: { previousTopicIds, topicIds } })
    return { status: 'OK' as const, topicIds }
  })
}
