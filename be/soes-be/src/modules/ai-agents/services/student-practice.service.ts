import { Prisma } from '@prisma/client'
import prisma from '../../../lib/prisma'
import { ConflictError, ForbiddenError, NotFoundError, TooManyRequestsError, ValidationError } from '../../../errors/AppError'
import { requestPracticeDraftAgent } from './ai-agent.client'
import { loadStudentMaterial } from './student-material.service'
import { practiceDraftSchema, type createPracticeSchema, type submitPracticeSchema } from '../validators/ai-agent.validator'
import type { z } from 'zod'
import { gradePractice } from './practice-grading'
import { choosePracticeDifficulty } from './practice-difficulty'

type PracticeQuestion = z.infer<typeof practiceDraftSchema>['questions'][number]

function publicItem(item: { id: string; orderIndex: number; snapshot: Prisma.JsonValue }) {
  const question = practiceDraftSchema.shape.questions.element.parse(item.snapshot)
  return { id: item.id, orderIndex: item.orderIndex, stem: question.stem, options: question.options }
}

async function assertOutsideExam(studentId: string) {
  const active = await prisma.examAttempt.count({ where: { studentId, status: 'IN_PROGRESS' } })
  if (active) throw new ForbiddenError('Practice is unavailable during an exam')
}

export async function createStudentPractice(studentId: string, input: z.infer<typeof createPracticeSchema>) {
  await assertOutsideExam(studentId)
  const recent = await prisma.practiceSet.count({
    where: { studentId, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  })
  if (recent >= 10) throw new TooManyRequestsError('Daily practice generation limit reached')
  const material = await loadStudentMaterial(studentId, input.materialId)
  const previous = await prisma.practiceSet.findMany({
    where: { studentId, subjectId: material.subjectId, completedAt: { not: null } },
    orderBy: { completedAt: 'desc' }, take: 3,
    select: { score: true, _count: { select: { items: true } } },
  })
  const difficulty = choosePracticeDifficulty(previous.map((set) => ({
    score: Number(set.score), questionCount: set._count.items,
  })))
  const draft = await requestPracticeDraftAgent({ material, count: input.count, difficulty })
  if (draft.questions.length !== input.count) throw new ValidationError('Invalid practice draft')
  await assertOutsideExam(studentId)
  const set = await prisma.$transaction(async (tx) => {
    const created = await tx.practiceSet.create({ data: { studentId, subjectId: material.subjectId }, select: { id: true } })
    await tx.practiceItem.createMany({ data: draft.questions.map((question: PracticeQuestion, index: number) => ({
      practiceSetId: created.id, sourceQuestionId: null, orderIndex: index + 1, points: 1,
      snapshot: { ...question, materialId: material.materialId, materialTitle: material.title } as Prisma.InputJsonValue,
    })) })
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
      const question = practiceDraftSchema.shape.questions.element.parse(item.snapshot)
      const source = item.snapshot as { materialTitle?: string }
      const answer = item.response?.answer as { selectedIndex: number } | undefined
      return { ...publicItem(item), ...(set.completedAt && answer && { result: {
        selectedIndex: answer.selectedIndex, correctIndex: question.correctIndex,
        explanation: question.explanation, supportQuote: question.supportQuote,
        materialTitle: source.materialTitle,
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
  const scored = gradePractice(set.items, input.answers)
  const score = scored.reduce((total, item) => total + item.score, 0)
  await prisma.$transaction(async (tx) => {
    const claim = await tx.practiceSet.updateMany({
      where: { id: practiceSetId, studentId, completedAt: null },
      data: { completedAt: new Date(), score },
    })
    if (claim.count !== 1) throw new ConflictError('Practice set already submitted')
    await tx.practiceResponse.createMany({ data: scored.map((item) => ({
      practiceItemId: item.itemId, answer: { selectedIndex: item.selectedIndex }, score: item.score,
    })) })
  })
  return getStudentPractice(studentId, practiceSetId)
}
