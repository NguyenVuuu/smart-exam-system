export type AppealStatus = 'PENDING' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED'

export interface TeacherAppeal {
  id: string
  reason: string
  status: AppealStatus
  teacherReply: string | null
  createdAt: string
  attemptId: string
  student: { id: string; studentCode: string; fullName: string }
  exam: { examId: string; scheduleId: string; title: string; scheduleTitle: string; score: number | null; maxScore: number }
}

export interface TeacherSubmission {
  attemptId: string
  autoScore: number | null
  manualScoreOverride: number | null
  finalScore: number | null
  answers: { questionId: string; selectedOptionIds: string[]; sourceCode: string | null; score: number | null }[]
}

export interface AppealPage {
  items: TeacherAppeal[]
  openCount: number
  pagination: { page: number; totalPages: number; totalItems: number }
}
