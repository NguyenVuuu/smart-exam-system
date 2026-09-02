import type { Prisma } from '@prisma/client'
import type { QuestionApprovalDto, TeacherQuestionDto } from '../dtos/teacher-question.dto'
import type { approvalInclude, questionInclude } from '../repositories/teacher-questions.repository'

type QuestionRow = Prisma.QuestionGetPayload<{ include: typeof questionInclude }>
type ApprovalRow = Prisma.QuestionBankItemGetPayload<{ include: typeof approvalInclude }>

export function toTeacherQuestionDto(row: QuestionRow): TeacherQuestionDto {
  const bank = row.questionBankItem
  return {
    id: row.id, title: row.title, content: row.content, explanation: row.explanation,
    type: row.type, difficulty: row.difficulty, aiDifficultyReason: row.aiDifficultyReason,
    source: row.source, language: row.language,
    subject: { id: row.subject.id, code: row.subject.code, name: row.subject.name },
    owner: { id: row.owner.id, fullName: row.owner.user.fullName },
    options: row.options.map(({ id, content, isCorrect }) => ({ id, content, isCorrect })),
    programmingConfig: row.programmingConfig ? {
      timeLimitMs: row.programmingConfig.timeLimitMs,
      memoryLimitMb: Math.round(row.programmingConfig.memoryLimitKb / 1024),
      maxCodeSizeKb: row.programmingConfig.maxCodeSizeKb,
    } : null,
    testCases: row.programmingTests.map((test) => ({
      id: test.id, input: test.input, expectedOutput: test.expectedOutput,
      isHidden: test.isHidden,
    })),
    sharedBank: bank ? {
      itemId: bank.id, status: bank.status, rejectionReason: bank.rejectionReason,
      removedAt: bank.removedAt, reviewedAt: bank.reviewedAt,
    } : null,
    createdAt: row.createdAt, updatedAt: row.updatedAt, archivedAt: row.archivedAt,
  }
}

export const toQuestionApprovalDto = (row: ApprovalRow): QuestionApprovalDto => ({
  id: row.id, status: row.status, addedAt: row.addedAt,
  reviewedAt: row.reviewedAt, rejectionReason: row.rejectionReason,
  question: toTeacherQuestionDto(row.question),
})
