import type { AttemptStatus, ResultReleaseMode } from '@prisma/client'
import { isResultReleased } from '../../exam-schedules/utils/result-release'

export type AttemptResultReason = 'AVAILABLE' | 'GRADING' | 'PENDING_RELEASE' | 'NEVER'

interface AttemptResultPolicyInput {
  status: AttemptStatus
  hasScore: boolean
  resultReleaseMode: ResultReleaseMode
  resultReleaseAt: Date | null
  resultsPublishedAt: Date | null
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
