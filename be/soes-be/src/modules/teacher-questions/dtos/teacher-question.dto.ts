export interface QuestionOptionDto {
  id: string; content: string; isCorrect: boolean
}

export interface TeacherQuestionDto {
  id: string; title: string; content: string; explanation: string | null
  type: string; difficulty: string; aiDifficultyReason: string | null; source: string; language: string | null
  subject: { id: string; code: string; name: string }
  owner: { id: string; fullName: string }
  options: QuestionOptionDto[]
  programmingConfig: { timeLimitMs: number; memoryLimitMb: number; maxCodeSizeKb: number } | null
  testCases: Array<{ id: string; input: string; expectedOutput: string; isHidden: boolean }>
  sharedBank: {
    itemId: string; status: string; rejectionReason: string | null
    removedAt: Date | null; reviewedAt: Date | null
  } | null
  createdAt: Date; updatedAt: Date; archivedAt: Date | null
}

export interface QuestionApprovalDto {
  id: string; status: string; addedAt: Date; reviewedAt: Date | null
  rejectionReason: string | null; question: TeacherQuestionDto
}
