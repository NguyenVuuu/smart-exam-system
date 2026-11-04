import { apiClient } from './client'

interface ApiResponse<T> { success: boolean; message: string; data: T }

const BASE = '/student/exam-schedules'

// ── Types ─────────────────────────────────────────────────────────────────────

export type AttemptStatusValue =
  | 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_SUBMITTED'
  | 'GRADING' | 'GRADED' | 'PUBLISHED' | 'EXPIRED' | 'INVALIDATED'

export interface AttemptStatus {
  attemptId: string
  status: AttemptStatusValue
  startedAt: string | null
  deadlineAt: string | null
  submittedAt: string | null
  endedBy: 'STUDENT' | 'TIMEOUT' | 'SYSTEM' | null
  remainingSeconds: number | null
  isOnline: boolean
  answeredCount: number
  totalQuestionCount: number
}

export interface ScoreAdjustment {
  id: string
  adjustmentType: 'SYSTEM_ERROR' | 'VIOLATION' | 'MANUAL_REVIEW' | 'GRADE_APPEAL' | 'OTHER'
  previousScore: number
  newScore: number
  reason: string
  evidenceUrls: string[]
  adjustedBy: string
  adjustedAt: string
}

export interface AttemptReviewOption {
  id: string
  content: string
  isCorrect?: boolean
}

export interface AttemptReviewItem {
  questionId: string
  orderIndex: number
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'PROGRAMMING'
  content: string
  points: number
  score: number | null
  isCorrect: boolean | null
  selectedOptionIds?: string[]
  draftSourceCode?: string | null
  options?: AttemptReviewOption[]
  correctOptionIds?: string[]
  explanation?: string
}

export interface AttemptResult {
  available: boolean
  releaseMode: 'IMMEDIATE' | 'MANUAL' | 'SCHEDULED' | 'NEVER'
  releaseAt: string | null
  score: number | null
  maxScore: number | null
  reviewPolicy: 'NONE' | 'SCORE_ONLY' | 'ANSWERS_NO_KEY' | 'FULL_AFTER_RELEASE' | null
  reviewAvailable: boolean
  reviewAvailableAt: string | null
  reviewConsumed: boolean
  reason: 'AVAILABLE' | 'GRADING' | 'PENDING_RELEASE' | 'NEVER'
  reviewItems: AttemptReviewItem[]
  scoreAdjustments: ScoreAdjustment[]
}

export interface GradeAppeal {
  id: string
  attemptId: string
  reason: string
  status: 'PENDING' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED'
  teacherReply: string | null
  handledAt: string | null
  createdAt: string
  updatedAt: string
}

// ── API ───────────────────────────────────────────────────────────────────────

export async function getAttemptStatus(scheduleId: string, attemptId: string): Promise<AttemptStatus> {
  const { data } = await apiClient.get<ApiResponse<AttemptStatus>>(
    `${BASE}/${scheduleId}/attempts/${attemptId}/status`,
  )
  return data.data
}

export async function getAttemptResult(scheduleId: string, attemptId: string): Promise<AttemptResult> {
  const { data } = await apiClient.get<ApiResponse<AttemptResult>>(
    `${BASE}/${scheduleId}/attempts/${attemptId}/result`,
  )
  return data.data
}

export async function listGradeAppeals(scheduleId: string, attemptId: string): Promise<GradeAppeal[]> {
  const { data } = await apiClient.get<ApiResponse<{ items: GradeAppeal[] }>>(
    `${BASE}/${scheduleId}/attempts/${attemptId}/appeals`,
  )
  return data.data.items
}

export async function createGradeAppeal(
  scheduleId: string, attemptId: string, reason: string,
): Promise<GradeAppeal> {
  const { data } = await apiClient.post<ApiResponse<GradeAppeal>>(
    `${BASE}/${scheduleId}/attempts/${attemptId}/appeals`,
    { reason },
  )
  return data.data
}
