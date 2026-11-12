import type { QuestionDifficulty, QuestionType } from '@prisma/client'
import { NotFoundError, ValidationError } from '../../../errors/AppError'
import prisma from '../../../lib/prisma'
import { requestExamMatrixAgent } from './ai-agent.client'
import type { z } from 'zod'
import type { examMatrixRequestSchema, examMatrixProposalSchema } from '../validators/ai-agent.validator'

type MatrixRequest = z.infer<typeof examMatrixRequestSchema>
type MatrixProposal = z.infer<typeof examMatrixProposalSchema>
type InventoryRow = { difficulty: QuestionDifficulty; type: QuestionType; count: number }

const typesByFormat: Record<MatrixRequest['format'], QuestionType[]> = {
  OBJECTIVE: ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE'],
  PROGRAMMING: ['PROGRAMMING'],
  MIXED: ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'PROGRAMMING'],
}

function countByDifficulty(rows: InventoryRow[], difficulty: QuestionDifficulty) {
  return rows.filter((row) => row.difficulty === difficulty).reduce((sum, row) => sum + row.count, 0)
}

export function validateExamMatrix(
  proposal: MatrixProposal, desiredCount: number, format: MatrixRequest['format'], rows: InventoryRow[],
) {
  const counts = { EASY: proposal.easyCount, MEDIUM: proposal.mediumCount, HARD: proposal.hardCount }
  if (Object.values(counts).reduce((sum, count) => sum + count, 0) !== desiredCount) {
    throw new ValidationError('Suggested matrix does not match the requested question count')
  }
  for (const difficulty of ['EASY', 'MEDIUM', 'HARD'] as const) {
    if (counts[difficulty] > countByDifficulty(rows, difficulty)) {
      throw new ValidationError(`Not enough ${difficulty.toLowerCase()} questions for the suggested matrix`)
    }
  }
  if (format === 'MIXED') {
    if (desiredCount < 2) throw new ValidationError('Mixed exams require at least two questions')
    let minimumProgramming = 0
    let maximumProgramming = 0
    for (const difficulty of ['EASY', 'MEDIUM', 'HARD'] as const) {
      const programming = rows.filter((row) => row.difficulty === difficulty && row.type === 'PROGRAMMING')
        .reduce((sum, row) => sum + row.count, 0)
      const objective = countByDifficulty(rows, difficulty) - programming
      minimumProgramming += Math.max(0, counts[difficulty] - objective)
      maximumProgramming += Math.min(counts[difficulty], programming)
    }
    if (minimumProgramming >= desiredCount || maximumProgramming < 1) {
      throw new ValidationError('Mixed matrix needs both objective and programming questions')
    }
  }
}

export async function suggestExamMatrix(teacherId: string, input: MatrixRequest) {
  const teacher = await prisma.teacher.findFirst({
    where: { id: teacherId, status: 'ACTIVE' }, select: { departmentId: true },
  })
  if (!teacher?.departmentId) throw new NotFoundError('Subject not found')
  const subject = await prisma.subject.findFirst({
    where: { id: input.subjectId, departmentId: teacher.departmentId }, select: { id: true },
  })
  if (!subject) throw new NotFoundError('Subject not found')

  const grouped = await prisma.question.groupBy({
    by: ['difficulty', 'type'],
    where: {
      subjectId: subject.id, archivedAt: null, type: { in: typesByFormat[input.format] },
      OR: [{ ownerId: teacherId }, { questionBankItem: { status: 'APPROVED', removedAt: null } }],
    },
    _count: { _all: true },
  })
  const rows = grouped.map((row) => ({ difficulty: row.difficulty, type: row.type, count: row._count._all }))
  const availableEasy = countByDifficulty(rows, 'EASY')
  const availableMedium = countByDifficulty(rows, 'MEDIUM')
  const availableHard = countByDifficulty(rows, 'HARD')
  const inventory = { availableEasy, availableMedium, availableHard }
  const shortage = Math.max(0, input.desiredCount - availableEasy - availableMedium - availableHard)
  if (shortage) return { proposal: null, inventory, shortage }
  const proposal = await requestExamMatrixAgent({
    message: input.message, desiredCount: input.desiredCount, format: input.format,
    availableEasy, availableMedium, availableHard,
  })
  validateExamMatrix(proposal, input.desiredCount, input.format, rows)
  return { proposal, inventory, shortage: 0 }
}
