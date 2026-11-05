import type { ExamQuestion, ExamSummary } from './teacher-exams.types'

export interface ExamApproval extends ExamSummary {
  reviewRound: { id: string; version: number; status: 'PENDING' | 'APPROVED' | 'REVISION_REQUESTED'; submittedAt: string }
}
export interface ApprovalSnapshot {
  title: string; description: string | null; defaultDurationMinutes: number; totalPoints: number | string
  examQuestions: (Omit<ExamQuestion, 'points' | 'programmingConfig' | 'testCases'> & {
    points: number | string
    programmingConfig: { timeLimitMs: number; memoryLimitKb: number; maxCodeSizeKb: number } | null
    programmingTests: ExamQuestion['testCases']
  })[]
}
export interface ExamApprovalDetail extends ExamApproval { snapshot: ApprovalSnapshot }
export interface ApprovalPage { items: ExamApproval[]; pagination: { page: number; totalPages: number; totalItems: number } }
export interface QuestionRevisionNote { questionId: string; note: string }
