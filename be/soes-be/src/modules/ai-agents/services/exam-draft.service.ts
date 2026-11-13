import type { z } from 'zod'
import { NotFoundError, ValidationError } from '../../../errors/AppError'
import { decryptField, decryptNullable } from '../../../lib/encryption'
import { openExamOption } from '../../../lib/exam-option-secret'
import prisma from '../../../lib/prisma'
import { writeAuditLog } from '../../audit-logs/audit-log.writer'
import { findAutoExamQuestionPool } from '../../teacher-exams/repositories/teacher-exams.repository'
import { auditQuestion } from '../../teacher-questions/services/question-audit.rules'
import { requestExamDraftAgent } from './ai-agent.client'
import type { examDraftRequestSchema } from '../validators/ai-agent.validator'

type DraftRequest = z.infer<typeof examDraftRequestSchema>
type Candidate = Awaited<ReturnType<typeof findAutoExamQuestionPool>>[number]

export function candidateRequiresReview(question: Candidate) {
  return auditQuestion({
    title: decryptField(question.title), content: decryptField(question.content),
    explanation: decryptNullable(question.explanation), type: question.type, language: question.language,
    options: question.options.map(openExamOption),
    timeLimitMs: question.programmingConfig?.timeLimitMs,
    memoryLimitMb: question.programmingConfig ? Math.round(question.programmingConfig.memoryLimitKb / 1024) : undefined,
    maxCodeSizeKb: question.programmingConfig?.maxCodeSizeKb,
    testCases: question.programmingTests.map((test) => ({
      input: decryptField(test.input), expectedOutput: decryptField(test.expectedOutput), isHidden: test.isHidden,
    })),
  }).some(({ severity }) => severity === 'HIGH')
}

export function defaultTopicTargets(pool: Candidate[], desiredCount: number) {
  const counts = new Map<string, number>()
  for (const question of pool) for (const { topicId } of question.topics) {
    counts.set(topicId, (counts.get(topicId) ?? 0) + 1)
  }
  return [...counts].sort((left, right) => left[1] - right[1])
    .slice(0, Math.min(desiredCount, 5)).map(([topicId]) => ({ topicId, count: 1 }))
}

export function validateExamDraftSelection(
  selectedIds: string[], pool: Candidate[], input: Pick<DraftRequest, 'desiredCount' | 'format' | 'topicTargets'>,
) {
  if (selectedIds.length !== input.desiredCount || new Set(selectedIds).size !== selectedIds.length) {
    throw new ValidationError('AI proposal has an invalid question count or duplicate questions')
  }
  const byId = new Map(pool.map((question) => [question.id, question]))
  const selected = selectedIds.map((id) => byId.get(id))
  if (selected.some((question) => !question)) throw new ValidationError('AI proposed unavailable questions')
  const questions = selected as Candidate[]
  if (input.format === 'MIXED' && (!questions.some((q) => q.type === 'PROGRAMMING')
    || !questions.some((q) => q.type !== 'PROGRAMMING'))) {
    throw new ValidationError('Mixed exam needs objective and programming questions')
  }
  for (const target of input.topicTargets) {
    if (questions.filter((question) => question.topics.some(({ topicId }) => topicId === target.topicId)).length < target.count) {
      throw new ValidationError('AI proposal does not meet the requested topic distribution')
    }
  }
  return questions
}

export async function proposeExamDraft(teacherId: string, userId: string, input: DraftRequest) {
  const teacher = await prisma.teacher.findFirst({
    where: { id: teacherId, status: 'ACTIVE' }, select: { departmentId: true },
  })
  if (!teacher?.departmentId) throw new NotFoundError('Subject not found')
  const subject = await prisma.subject.findFirst({
    where: { id: input.subjectId, departmentId: teacher.departmentId }, select: { id: true, name: true },
  })
  if (!subject) throw new NotFoundError('Subject not found')
  const topics = await prisma.learningTopic.findMany({
    where: { subjectId: subject.id }, select: { id: true, code: true, name: true },
  })
  const topicById = new Map(topics.map((topic) => [topic.id, topic]))
  if (input.topicTargets.some(({ topicId }) => !topicById.has(topicId))) {
    throw new ValidationError('Topic does not belong to the selected subject')
  }
  const pool = await findAutoExamQuestionPool(teacherId, {
    subjectId: subject.id, format: input.format, sourceScope: 'BOTH', selectedQuestionIds: [],
  })
  if (pool.length > 500) throw new ValidationError('Question bank is too large for one AI request; narrow the subject bank')
  const eligiblePool = pool.filter((question) => !candidateRequiresReview(question))
  if (eligiblePool.length < input.desiredCount) {
    throw new ValidationError('Question bank does not have enough questions that passed the required checks')
  }
  const topicTargets = input.topicTargets.length ? input.topicTargets : defaultTopicTargets(eligiblePool, input.desiredCount)
  for (const target of topicTargets) {
    if (eligiblePool.filter((question) => question.topics.some(({ topicId }) => topicId === target.topicId)).length < target.count) {
      throw new ValidationError(`Not enough questions for topic ${topicById.get(target.topicId)!.name}`)
    }
  }
  const proposal = await requestExamDraftAgent({
    message: input.message, desiredCount: input.desiredCount, format: input.format,
    topicTargets: Object.fromEntries(topicTargets.map(({ topicId, count }) => [topicById.get(topicId)!.code, count])),
    candidates: eligiblePool.map((question) => ({
      id: question.id, title: decryptField(question.title).slice(0, 180),
      content: decryptField(question.content).slice(0, 300),
      type: question.type, difficulty: question.difficulty,
      topics: question.topics.map(({ topic }) => topic.code),
    })),
  })
  const selected = validateExamDraftSelection(proposal.questionIds, eligiblePool, { ...input, topicTargets })
  const topicMatrix = topics.map((topic) => ({
    ...topic, count: selected.filter((question) => question.topics.some(({ topicId }) => topicId === topic.id)).length,
  })).filter((topic) => topic.count > 0)
  await writeAuditLog(prisma, {
    userId, action: 'REQUEST_AI_EXAM_DRAFT', entityType: 'Subject', entityId: subject.id,
    metadata: { desiredCount: input.desiredCount, format: input.format, selectedQuestionIds: proposal.questionIds },
  })
  return {
    ...proposal, topicMatrix,
    unlabeledCount: selected.filter((question) => question.topics.length === 0).length,
    difficultyMatrix: {
      easy: selected.filter((question) => question.difficulty === 'EASY').length,
      medium: selected.filter((question) => question.difficulty === 'MEDIUM').length,
      hard: selected.filter((question) => question.difficulty === 'HARD').length,
    },
    questions: selected.map((question) => ({ id: question.id, title: decryptField(question.title), difficulty: question.difficulty,
      type: question.type, topics: question.topics.map(({ topic }) => topic.name) })),
  }
}
