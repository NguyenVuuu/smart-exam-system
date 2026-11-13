import type { z } from 'zod'
import { NotFoundError, ValidationError } from '../../../errors/AppError'
import prisma from '../../../lib/prisma'
import { writeAuditLog } from '../../audit-logs/audit-log.writer'
import type { topicSuggestionRequestSchema } from '../validators/ai-agent.validator'
import { requestTopicSuggestionAgent } from './ai-agent.client'

type TopicRequest = z.infer<typeof topicSuggestionRequestSchema>

export async function suggestQuestionTopic(teacherId: string, userId: string, input: TopicRequest) {
  const subject = await prisma.subject.findFirst({
    where: { id: input.subjectId, department: { teachers: { some: { id: teacherId, status: 'ACTIVE' } } } },
    select: { id: true },
  })
  if (!subject) throw new NotFoundError('Subject not found')
  if (input.questionId) {
    const question = await prisma.question.findFirst({
      where: { id: input.questionId, subjectId: subject.id, ownerId: teacherId, archivedAt: null },
      select: { id: true },
    })
    if (!question) throw new NotFoundError('Question not found')
  }
  const topics = await prisma.learningTopic.findMany({
    where: { subjectId: subject.id }, select: { id: true, code: true, name: true },
  })
  const suggestion = await requestTopicSuggestionAgent({
    title: input.title, content: input.content,
    existingTopics: topics.map(({ code, name }) => ({ code, name })),
  })
  const existingCodes = new Set(suggestion.existingCodes.map((code) => code.toUpperCase()))
  const existing = topics.filter((topic) => existingCodes.has(topic.code.toUpperCase()))
  const newCode = suggestion.newCode?.trim().toUpperCase() ?? ''
  const newName = suggestion.newName?.trim() ?? ''
  const isNewValid = /^[A-Z0-9_-]{2,32}$/.test(newCode) && newName.length >= 3
    && !topics.some((topic) => topic.code.toUpperCase() === newCode || topic.name.toLocaleLowerCase() === newName.toLocaleLowerCase())
  if (!existing.length && !isNewValid) throw new ValidationError('AI could not suggest a valid topic')
  await writeAuditLog(prisma, {
    userId, action: 'REQUEST_AI_TOPIC_SUGGESTION', entityType: 'Subject', entityId: subject.id,
    metadata: { questionId: input.questionId ?? null, existingTopicIds: existing.map(({ id }) => id) },
  })
  return { existing, proposed: isNewValid ? { code: newCode, name: newName } : null,
    rationale: suggestion.rationale }
}
