export interface QuestionOptionDto {
  id: string; content: string; isCorrect: boolean
}

export interface TeacherQuestionDto {
  id: string; title: string; content: string; explanation: string | null
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'PROGRAMMING'
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'; aiDifficultyReason: string | null; source: string
  language: 'JAVA' | 'C' | 'CPP' | null
  subject: { id: string; code: string; name: string }
  owner: { id: string; fullName: string }
  options: QuestionOptionDto[]
  programmingConfig: { timeLimitMs: number; memoryLimitMb: number; maxCodeSizeKb: number } | null
  testCases: Array<{ id: string; input: string; expectedOutput: string; isHidden: boolean }>
  sharedBank: {
    itemId: string; status: string; rejectionReason: string | null
    removedAt: Date | null; reviewedAt: Date | null
    removalReason: string | null; removedByName: string | null
  } | null
  createdAt: Date; updatedAt: Date; archivedAt: Date | null
}

export interface QuestionAuditItemDto {
  question: TeacherQuestionDto
  severity: 'HIGH' | 'LOW'
  issues: Array<{
    code: string
    severity: 'HIGH' | 'LOW'
    field: string
    message: string
  }>
}

export interface QuestionAuditSummaryDto {
  auditedQuestionCount: number
  requiredQuestionCount: number
  warningQuestionCount: number
  qualifiedQuestionCount: number
  issueCount: number
}

export interface QuestionApprovalDto {
  id: string; status: string; addedAt: Date; reviewedAt: Date | null
  rejectionReason: string | null; question: TeacherQuestionDto
}
