export interface AdminQuestionBankItemDto {
  id: string; content: string; explanation: string | null; type: string; difficulty: string
  subject: { id: string; code: string; name: string; departmentId: string }
  contributor: { id: string; fullName: string }
  reviewer: { id: string; fullName: string } | null
  status: 'APPROVED' | 'REMOVED'; reviewedAt: Date | null
  removedAt: Date | null; removedBy: string | null; removalReason: string | null
  options: Array<{ id: string; content: string; isCorrect: boolean }>
  programmingConfig: { timeLimitMs: number; memoryLimitMb: number; maxCodeSizeKb: number } | null
  testCases: Array<{ id: string; input: string; expectedOutput: string; weight: number; isHidden: boolean }>
}

export interface AdminExamTrackingDto {
  id: string; title: string; description: string | null; type: string; format: string
  status: string; approvalStatus: string; totalPoints: number; durationMinutes: number
  subject: { id: string; code: string; name: string; departmentId: string }
  creator: { id: string; fullName: string }; reviewer: { id: string; fullName: string } | null
  questionCount: number; scheduleCount: number; createdAt: Date; updatedAt: Date
}
