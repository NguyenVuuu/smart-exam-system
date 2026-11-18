type ReviewStatus = 'PENDING' | 'REVIEWED' | 'CONFIRMED' | 'DISMISSED' | 'WARNED' | 'FORCE_SUBMITTED' | 'INVALIDATED'

export function proctoringRiskSummary(violations: Array<{ severity: string; reviewStatus: ReviewStatus }>) {
  const relevant = violations.filter((violation) => violation.reviewStatus !== 'DISMISSED')
  if (relevant.some((violation) => violation.severity === 'HIGH' && violation.reviewStatus === 'CONFIRMED')) return 'SERIOUS' as const
  if (relevant.some((violation) => violation.reviewStatus === 'PENDING' || violation.reviewStatus === 'CONFIRMED') || relevant.length >= 3) {
    return 'NEEDS_REVIEW' as const
  }
  return 'NORMAL' as const
}
