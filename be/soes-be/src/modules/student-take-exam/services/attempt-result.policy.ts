import type { AttemptStatus, ResultReleaseMode, ReviewPolicy } from '@prisma/client'
import { isResultReleased } from '../../exam-schedules/utils/result-release'

export type AttemptResultReason = 'AVAILABLE' | 'GRADING' | 'PENDING_RELEASE' | 'NEVER'

interface AttemptResultPolicyInput {
  status: AttemptStatus
  hasScore: boolean
  resultReleaseMode: ResultReleaseMode
  resultReleaseAt: Date | null
  resultsPublishedAt: Date | null
}

interface AttemptReviewPolicyInput {
  resultAvailable: boolean
  reviewPolicy: ReviewPolicy
  scheduleEndTime: Date
}

export interface AttemptReviewAccess {
  available: boolean
  availableAt: Date | null
}

const GRADED_STATUSES: AttemptStatus[] = ['AUTO_SUBMITTED', 'GRADED', 'PUBLISHED']

export function resolveAttemptResultReason(
  input: AttemptResultPolicyInput,
  now = new Date(),
): AttemptResultReason {
  if (input.resultReleaseMode === 'NEVER') return 'NEVER'

  const gradingCompleted = input.hasScore && GRADED_STATUSES.includes(input.status)
  if (!gradingCompleted) return 'GRADING'

  return isResultReleased(input, now) ? 'AVAILABLE' : 'PENDING_RELEASE'
}

export function resolveAttemptReviewAccess(
  input: AttemptReviewPolicyInput,
  now = new Date(),
): AttemptReviewAccess {
  const supportsAnswerReview = input.reviewPolicy === 'ANSWERS_NO_KEY'
    || input.reviewPolicy === 'FULL_AFTER_RELEASE'

  if (!input.resultAvailable || !supportsAnswerReview) {
    return { available: false, availableAt: null }
  }

  if (now < input.scheduleEndTime) {
    return { available: false, availableAt: input.scheduleEndTime }
  }

  return { available: true, availableAt: null }
}
