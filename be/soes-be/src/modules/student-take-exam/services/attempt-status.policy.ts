const ALREADY_SUBMITTED_STATUSES = ['SUBMITTED', 'GRADING', 'GRADED', 'PUBLISHED'] as const

export function isAlreadySubmittedStatus(status: string) {
  return ALREADY_SUBMITTED_STATUSES.includes(status as typeof ALREADY_SUBMITTED_STATUSES[number])
}
