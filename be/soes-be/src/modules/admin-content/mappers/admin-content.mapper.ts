import type { Prisma } from '@prisma/client'
import type { AdminExamTrackingDto, AdminQuestionBankItemDto } from '../dtos/admin-content.dto'
import type { bankInclude, trackedExamInclude } from '../repositories/admin-content.repository'
import { decryptField, decryptNullable } from '../../../lib/encryption'
import { openExamOption } from '../../../lib/exam-option-secret'

type BankRow = Prisma.QuestionBankItemGetPayload<{ include: typeof bankInclude }>
type ExamRow = Prisma.ExamGetPayload<{ include: typeof trackedExamInclude }>

export const toAdminQuestionBankItemDto = (row: BankRow): AdminQuestionBankItemDto => ({
  id: row.id, title: decryptField(row.question.title), content: decryptField(row.question.content), explanation: decryptNullable(row.question.explanation),
  type: row.question.type, difficulty: row.question.difficulty,
  subject: row.question.subject,
  contributor: { id: row.question.owner.id, fullName: row.question.owner.user.fullName },
  reviewer: row.reviewedByTeacher
    ? { id: row.reviewedByTeacher.id, fullName: row.reviewedByTeacher.user.fullName }
    : null,
  status: row.removedAt ? 'REMOVED' : 'APPROVED', reviewedAt: row.reviewedAt,
  removedAt: row.removedAt,
  removedBy: row.removedByAdmin?.user.fullName ?? row.removedByTeacher?.user.fullName ?? null,
  removalReason: row.removalReason,
  options: row.question.options.map((option) => {
    const { content, isCorrect } = openExamOption(option)
    return { id: option.id, content, isCorrect }
  }),
  programmingConfig: row.question.programmingConfig ? {
    timeLimitMs: row.question.programmingConfig.timeLimitMs,
    memoryLimitMb: Math.round(row.question.programmingConfig.memoryLimitKb / 1024),
    maxCodeSizeKb: row.question.programmingConfig.maxCodeSizeKb,
  } : null,
  testCases: row.question.programmingTests.map((test) => ({
    id: test.id, input: decryptField(test.input), expectedOutput: decryptField(test.expectedOutput),
    isHidden: test.isHidden,
  })),
})

export const toAdminExamTrackingDto = (row: ExamRow): AdminExamTrackingDto => ({
  id: row.id, title: row.title, description: row.description, type: row.type,
  format: row.format, status: row.status, approvalStatus: row.approvalStatus,
  totalPoints: Number(row.totalPoints), durationMinutes: row.defaultDurationMinutes,
  subject: row.subject,
  semester: row.semester,
  creator: { id: row.createdBy.id, fullName: row.createdBy.user.fullName },
  reviewer: row.reviewedBy ? { id: row.reviewedBy.id, fullName: row.reviewedBy.user.fullName } : null,
  questionCount: row._count.examQuestions, scheduleCount: row._count.schedules,
  createdAt: row.createdAt, updatedAt: row.updatedAt,
})
