export interface ExamSummary {
  id: string; title: string; description: string | null
  type: 'QUIZ' | 'MIDTERM' | 'FINAL'; format: 'OBJECTIVE' | 'PROGRAMMING' | 'MIXED'
  status: 'DRAFT' | 'READY' | 'LOCKED' | 'ARCHIVED'
  approvalStatus: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED'
  defaultDurationMinutes: number; totalPoints: number; questionCount: number; scheduleCount: number
  subject: { code: string; name: string }; semester: { name: string }; createdAt: string
}
export interface ExamQuestion {
  id: string; title: string; content: string; explanation: string | null; orderIndex: number; points: number
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'PROGRAMMING'
  language: 'JAVA' | 'C' | 'CPP' | null
  options: { id: string; content: string; isCorrect: boolean }[]
  programmingConfig: { timeLimitMs: number; memoryLimitMb: number; maxCodeSizeKb: number } | null
  testCases: { id: string; input: string; expectedOutput: string; isHidden: boolean }[]
}
export interface ExamDetail extends ExamSummary {
  questions: ExamQuestion[]
  sections: { id: string; title: string; description: string | null; type: string; orderIndex: number }[]
  revisionFeedback?: { questionId: string; order: number; title: string; note: string }[]
}
export interface ExamPage { items: ExamSummary[]; pagination: { page: number; totalPages: number; totalItems: number } }
export interface ExamSchedule { id: string; title: string; startTime: string; endTime: string; status: string }
export interface ReviewHistory { id: string; status: string; version: number; submittedAt: string; decision?: { type: string; reason?: string | null } | null }
