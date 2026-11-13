import type { Prisma } from '@prisma/client'
import type { QuestionApprovalDto, TeacherQuestionDto } from '../dtos/teacher-question.dto'
import type { approvalInclude, questionInclude } from '../repositories/teacher-questions.repository'
import { decryptField, decryptNullable } from '../../../lib/encryption'
import { openExamOption } from '../../../lib/exam-option-secret'

type QuestionRow = Prisma.QuestionGetPayload<{ include: typeof questionInclude }>
type ApprovalRow = Prisma.QuestionBankItemGetPayload<{ include: typeof approvalInclude }>

export function toTeacherQuestionDto(row: QuestionRow): TeacherQuestionDto {
  const bank = row.questionBankItem
  return {
    id: row.id, title: decryptField(row.title), content: decryptField(row.content), explanation: decryptNullable(row.explanation),
    type: row.type, difficulty: row.difficulty, aiDifficultyReason: row.aiDifficultyReason,
    source: row.source, language: row.language,
    subject: { id: row.subject.id, code: row.subject.code, name: row.subject.name },
    topics: row.topics.map(({ topic }) => topic),
    owner: { id: row.owner.id, fullName: row.owner.user.fullName },
    options: row.options.map((option) => {
      const { content, isCorrect } = openExamOption(option)
      return { id: option.id, content, isCorrect }
    }),
    programmingConfig: row.programmingConfig ? {
      timeLimitMs: row.programmingConfig.timeLimitMs,
      memoryLimitMb: Math.round(row.programmingConfig.memoryLimitKb / 1024),
      maxCodeSizeKb: row.programmingConfig.maxCodeSizeKb,
    } : null,
    testCases: row.programmingTests.map((test) => ({
      id: test.id, input: decryptField(test.input), expectedOutput: decryptField(test.expectedOutput),
      isHidden: test.isHidden,
    })),
    sharedBank: bank ? {
      itemId: bank.id, status: bank.status, rejectionReason: bank.rejectionReason,
      removedAt: bank.removedAt, reviewedAt: bank.reviewedAt,
      removalReason: bank.removalReason,
      removedByName: bank.removedByTeacher?.user.fullName ?? bank.removedByAdmin?.user.fullName ?? null,
    } : null,
    createdAt: row.createdAt, updatedAt: row.updatedAt, archivedAt: row.archivedAt,
  }
}

export const toQuestionApprovalDto = (row: ApprovalRow): QuestionApprovalDto => ({
  id: row.id, status: row.status, addedAt: row.addedAt,
  reviewedAt: row.reviewedAt, rejectionReason: row.rejectionReason,
  question: toTeacherQuestionDto(row.question),
})
