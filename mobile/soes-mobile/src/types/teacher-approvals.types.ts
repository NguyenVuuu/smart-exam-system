import type { ExamQuestion, ExamSummary } from './teacher-exams.types'

export interface ExamApproval extends ExamSummary {
  creator?: { id: string; fullName: string } | null
  reviewer?: { id: string; fullName: string } | null
  reviewRound: { id: string; version: number; status: 'PENDING' | 'APPROVED' | 'REVISION_REQUESTED'; submittedAt: string; reviewerName?: string | null }
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
export interface ReviewHistoryItem {
  id: string; version: number; status: 'PENDING' | 'APPROVED' | 'REVISION_REQUESTED'; submittedAt: string; decidedAt: string | null
  submittedBy: { id: string; fullName: string }
  decision: { type: string; reason: string | null; questionFeedback: Array<{ questionId: string; order: number; title: string; note: string }>; createdAt: string; reviewer: { id: string; fullName: string } } | null
  snapshot: ApprovalSnapshot
}
