import type { ExamAvailabilityStatus } from '../types/student-course-detail.types'

export interface ExamDetailResponseDto {
  id: string
  title: string
  description: string
  startTime: Date
  endTime: Date
  durationMinutes: number
  maxAttempts: number
  attemptUsed: number
  remainingAttempts: number
  canStart: boolean
  status: ExamAvailabilityStatus
  remainingSeconds?: number | null
  canResume?: boolean
  attemptId?: string | null
}