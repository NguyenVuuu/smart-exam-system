import type { Question } from '../types/teacher-question-bank.types'
import type { QuestionPayload, TeacherQuestionDto } from '../types/teacher-question-api.types'

function reviewStatus(dto: TeacherQuestionDto): Question['reviewStatus'] {
  const bank = dto.sharedBank
  if (!bank) return 'PRIVATE'
  if (bank.removedAt) return 'PRIVATE'
  if (bank.status === 'PENDING') return 'PENDING_REVIEW'
  return bank.status
}

export const toQuestion = (dto: TeacherQuestionDto): Question => ({
  id: dto.id,
  subjectId: dto.subject.id,
  subjectName: dto.subject.name,
  teacherId: dto.owner.id,
  teacherName: dto.owner.fullName,
  bankScope: dto.sharedBank?.status === 'APPROVED' && !dto.sharedBank.removedAt ? 'SHARED' : 'PERSONAL',
  reviewStatus: reviewStatus(dto),
  rejectionReason: dto.sharedBank?.rejectionReason ?? undefined,
  removedByName: dto.sharedBank?.removedByName ?? undefined,
  removedAt: dto.sharedBank?.removedAt ?? undefined,
  removalReason: dto.sharedBank?.removalReason ?? undefined,
  sharedBankItemId: dto.sharedBank?.itemId,
  type: dto.type,
  difficulty: dto.difficulty,
  aiDifficultyReason: dto.aiDifficultyReason ?? undefined,
  title: dto.title,
  content: dto.content,
  explanation: dto.explanation ?? undefined,
  options: dto.options,
  programmingLanguage: dto.language ?? undefined,
  timeLimitMs: dto.programmingConfig?.timeLimitMs,
  memoryLimitMb: dto.programmingConfig?.memoryLimitMb,
  maxCodeSizeKb: dto.programmingConfig?.maxCodeSizeKb,
  testCases: dto.testCases,
  createdAt: dto.createdAt,
  archivedAt: dto.archivedAt ?? undefined,
})

export const toQuestionPayload = (question: Partial<Question>): QuestionPayload => ({
  subjectId: question.subjectId!,
  title: question.title!,
  content: question.type === 'PROGRAMMING' ? question.content! : question.title!,
  explanation: question.explanation || null,
  type: question.type!,
  difficulty: question.difficulty!,
  language: question.type === 'PROGRAMMING' ? question.programmingLanguage : null,
  options: question.type === 'PROGRAMMING'
    ? []
    : (question.options ?? []).map(({ content, isCorrect }) => ({ content, isCorrect })),
  timeLimitMs: question.type === 'PROGRAMMING' ? question.timeLimitMs : undefined,
  memoryLimitMb: question.type === 'PROGRAMMING' ? question.memoryLimitMb : undefined,
  maxCodeSizeKb: question.type === 'PROGRAMMING' ? question.maxCodeSizeKb : undefined,
  testCases: question.type === 'PROGRAMMING'
    ? (question.testCases ?? []).map(({ input, expectedOutput, isHidden }) => ({
        input, expectedOutput, isHidden,
      }))
    : [],
})
