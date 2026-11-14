import { Prisma } from '@prisma/client'
import prisma from '../../../lib/prisma'
import { ConflictError, ForbiddenError, NotFoundError, TooManyRequestsError, ValidationError } from '../../../errors/AppError'
import { requestPracticeDraftAgent, requestProgrammingPracticeDraftAgent } from './ai-agent.client'
import { loadStudentMaterial } from './student-material.service'
import { practiceDraftSchema, programmingPracticeQuestionSchema, type createPracticeSchema, type submitPracticeSchema } from '../validators/ai-agent.validator'
import type { z } from 'zod'
import { gradePractice } from './practice-grading'
import { choosePracticeDifficulty } from './practice-difficulty'
import { studentInsights } from '../../learning-analytics/services/learning-analytics.service'
import { selectWeakPracticeTopic } from './practice-focus'
import { writeAuditLog } from '../../audit-logs/audit-log.writer'
import { gradeProgrammingPractice, practiceLanguage, runProgrammingPracticeSample, verifyProgrammingDraft, wantsProgrammingPractice } from './programming-practice.service'

type PracticeQuestion = z.infer<typeof practiceDraftSchema>['questions'][number]
type ProgrammingQuestion = z.infer<typeof programmingPracticeQuestionSchema>

function publicItem(item: { id: string; orderIndex: number; snapshot: Prisma.JsonValue }) {
  if ((item.snapshot as { kind?: string }).kind === 'PROGRAMMING') {
    const question = programmingPracticeQuestionSchema.parse(item.snapshot)
    return { id: item.id, orderIndex: item.orderIndex, kind: 'PROGRAMMING' as const,
      stem: question.stem, language: question.language, starterCode: question.starterCode,
      sampleInput: question.testCases[0].input, sampleOutput: question.testCases[0].expectedOutput }
  }
  const question = practiceDraftSchema.shape.questions.element.parse(item.snapshot)
  return { id: item.id, orderIndex: item.orderIndex, kind: 'CHOICE' as const,
    stem: question.stem, options: question.options }
}

async function assertOutsideExam(studentId: string) {
  const active = await prisma.examAttempt.count({ where: { studentId, status: 'IN_PROGRESS' } })
  if (active) throw new ForbiddenError('Practice is unavailable during an exam')
}

export async function createStudentPractice(studentId: string, userId: string, input: z.infer<typeof createPracticeSchema>) {
  await assertOutsideExam(studentId)
  const recent = await prisma.practiceSet.count({
    where: { studentId, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  })
  if (recent >= 10) throw new TooManyRequestsError('Daily practice generation limit reached')
  const material = await loadStudentMaterial(studentId, input.materialId)
  const focusTopic = input.focusTopicId
    ? selectWeakPracticeTopic((await studentInsights(studentId)).topics, input.focusTopicId, material.subjectId)
    : undefined
  if (input.focusTopicId && !focusTopic) throw new ValidationError('Weak topic is not available for this material')
  const previous = await prisma.practiceSet.findMany({
    where: { studentId, subjectId: material.subjectId, completedAt: { not: null } },
    orderBy: { completedAt: 'desc' }, take: 3,
    select: { score: true, _count: { select: { items: true } } },
  })
  const difficulty = choosePracticeDifficulty(previous.map((set) => ({
    score: Number(set.score), questionCount: set._count.items,
  })))
  const request = { material, count: input.count, difficulty,
    ...(focusTopic && { focusTopic: { code: focusTopic.code, name: focusTopic.name } }),
    ...(input.instruction && { instruction: input.instruction }) }
  const programming = input.kind === 'PROGRAMMING' || (input.kind === undefined && wantsProgrammingPractice(input.instruction))
  let questions: Array<PracticeQuestion | ProgrammingQuestion>
  if (programming) {
    const language = practiceLanguage(input.instruction, material.subjectName)
    const draft = await requestProgrammingPracticeDraftAgent({ ...request, language })
    await verifyProgrammingDraft(draft.questions, language)
    questions = draft.questions
  } else {
    questions = (await requestPracticeDraftAgent(request)).questions
  }
  if (questions.length !== input.count) throw new ValidationError('Invalid practice draft')
  await assertOutsideExam(studentId)
  const set = await prisma.$transaction(async (tx) => {
    const created = await tx.practiceSet.create({ data: { studentId, subjectId: material.subjectId }, select: { id: true } })
    await tx.practiceItem.createMany({ data: questions.map((question, index: number) => ({
      practiceSetId: created.id, sourceQuestionId: null, orderIndex: index + 1, points: 1,
      snapshot: { ...question, kind: programming ? 'PROGRAMMING' : 'CHOICE',
        materialId: material.materialId, materialTitle: material.title,
        ...(focusTopic && { focusTopicId: focusTopic.topicId }) } as Prisma.InputJsonValue,
    })) })
    await writeAuditLog(tx, {
      userId, action: 'CREATE_AI_PRACTICE', entityType: 'PracticeSet', entityId: created.id,
      metadata: { materialId: input.materialId, questionCount: questions.length, kind: programming ? 'PROGRAMMING' : 'CHOICE',
        ...(focusTopic && { focusTopicId: focusTopic.topicId }) },
    })
    return tx.practiceSet.findUniqueOrThrow({ where: { id: created.id },
      select: { id: true, items: { select: { id: true, orderIndex: true, snapshot: true }, orderBy: { orderIndex: 'asc' } } } })
  })
  return { id: set.id, items: set.items.map(publicItem) }
}

export async function getStudentPractice(studentId: string, practiceSetId: string) {
  await assertOutsideExam(studentId)
  const set = await prisma.practiceSet.findFirst({
    where: { id: practiceSetId, studentId },
    select: { id: true, completedAt: true, score: true,
      items: { select: { id: true, orderIndex: true, snapshot: true, response: { select: { answer: true, score: true } } },
        orderBy: { orderIndex: 'asc' } },
    },
  })
  if (!set) throw new NotFoundError('Practice set not found')
  return {
    id: set.id, completedAt: set.completedAt, score: set.score === null ? null : Number(set.score),
    items: set.items.map((item) => {
      const source = item.snapshot as { materialTitle?: string }
      if (source && (source as { kind?: string }).kind === 'PROGRAMMING') {
        const question = programmingPracticeQuestionSchema.parse(item.snapshot)
        const answer = item.response?.answer as { sourceCode: string; passedTestCases: number; totalTestCases: number } | undefined
        return { ...publicItem(item), ...(set.completedAt && answer && { result: {
          ...answer, explanation: question.explanation, supportQuote: question.supportQuote,
          materialTitle: source.materialTitle, sourceLocation: question.sourceLocation,
        } }) }
      }
      const question = practiceDraftSchema.shape.questions.element.parse(item.snapshot)
      const answer = item.response?.answer as { selectedIndex: number } | undefined
      return { ...publicItem(item), ...(set.completedAt && answer && { result: {
        selectedIndex: answer.selectedIndex, correctIndex: question.correctIndex,
        explanation: question.explanation, supportQuote: question.supportQuote,
        materialTitle: source.materialTitle, sourceLocation: question.sourceLocation,
      } }) }
    }),
  }
}

export async function listStudentPractice(studentId: string) {
  await assertOutsideExam(studentId)
  const rows = await prisma.practiceSet.findMany({
    where: { studentId }, orderBy: { createdAt: 'desc' }, take: 20,
    select: { id: true, createdAt: true, completedAt: true, score: true,
      subject: { select: { name: true } }, _count: { select: { items: true } } },
  })
  return rows.map((row) => ({ ...row, score: row.score === null ? null : Number(row.score) }))
}

export async function runStudentPracticeSample(studentId: string, practiceSetId: string, itemId: string, sourceCode: string) {
  await assertOutsideExam(studentId)
  const set = await prisma.practiceSet.findFirst({
    where: { id: practiceSetId, studentId, completedAt: null },
    select: { items: { where: { id: itemId }, select: { snapshot: true }, take: 1 } },
  })
  if (!set || !set.items.length) throw new NotFoundError('Practice item not found')
  if ((set.items[0].snapshot as { kind?: string }).kind !== 'PROGRAMMING')
    throw new ValidationError('Only programming practice can be run')
  return runProgrammingPracticeSample(sourceCode, programmingPracticeQuestionSchema.parse(set.items[0].snapshot))
}

export async function submitStudentPractice(studentId: string, practiceSetId: string,
  input: z.infer<typeof submitPracticeSchema>) {
  await assertOutsideExam(studentId)
  const set = await prisma.practiceSet.findFirst({
    where: { id: practiceSetId, studentId },
    select: { id: true, completedAt: true,
      items: { select: { id: true, snapshot: true } },
    },
  })
  if (!set) throw new NotFoundError('Practice set not found')
  if (set.completedAt) throw new ConflictError('Practice set already submitted')
  const ids = new Set(input.answers.map((answer) => answer.itemId))
  if (ids.size !== set.items.length || input.answers.length !== set.items.length
      || set.items.some((item) => !ids.has(item.id))) throw new ValidationError('Submit one answer for every question')
  const programming = (set.items[0].snapshot as { kind?: string }).kind === 'PROGRAMMING'
  const scored: Array<{ itemId: string; score: number; answer: Prisma.InputJsonValue }> = []
  if (programming) {
    const answers = new Map(input.answers.map((answer) => [answer.itemId, answer]))
    for (let start = 0; start < set.items.length; start += 3) {
      scored.push(...await Promise.all(set.items.slice(start, start + 3).map(async (item) => {
        const answer = answers.get(item.id)
        if (!answer || !('sourceCode' in answer)) throw new ValidationError('Source code is required')
        const question = programmingPracticeQuestionSchema.parse(item.snapshot)
        const result = await gradeProgrammingPractice(answer.sourceCode, question)
        return { itemId: item.id, score: result.score, answer: { sourceCode: answer.sourceCode,
          passedTestCases: result.passedTestCases, totalTestCases: result.totalTestCases } }
      })))
    }
  } else {
    if (input.answers.some((answer) => !('selectedIndex' in answer))) throw new ValidationError('Choice answer is required')
    scored.push(...gradePractice(set.items, input.answers as Array<{ itemId: string; selectedIndex: number }>).map((item) => ({
      itemId: item.itemId, score: item.score, answer: { selectedIndex: item.selectedIndex },
    })))
  }
  const score = scored.reduce((total, item) => total + item.score, 0)
  await prisma.$transaction(async (tx) => {
    const claim = await tx.practiceSet.updateMany({
      where: { id: practiceSetId, studentId, completedAt: null },
      data: { completedAt: new Date(), score },
    })
    if (claim.count !== 1) throw new ConflictError('Practice set already submitted')
    await tx.practiceResponse.createMany({ data: scored.map((item) => ({
      practiceItemId: item.itemId, answer: item.answer, score: item.score,
    })) })
  })
  return getStudentPractice(studentId, practiceSetId)
}
