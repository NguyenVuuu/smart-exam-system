type Purpose = 'ENROLLMENT' | 'EXAM_ENTRY'
type LivenessResult = { status: string | undefined; confidence: number; image?: Uint8Array }
type Thresholds = { enrollmentLivenessThreshold: number; livenessThreshold: number }

export function assessLiveness(purpose: Purpose, result: LivenessResult, thresholds: Thresholds) {
  if (result.status !== 'SUCCEEDED') return { accepted: false as const, failureCode: 'LIVENESS_NOT_COMPLETED' }
  const minimum = purpose === 'ENROLLMENT' ? thresholds.enrollmentLivenessThreshold : thresholds.livenessThreshold
  if (result.confidence < minimum) return { accepted: false as const, failureCode: 'LIVENESS_LOW_CONFIDENCE' }
  if (!result.image) return { accepted: false as const, failureCode: 'LIVENESS_REFERENCE_IMAGE_MISSING' }
  return { accepted: true as const, image: result.image }
}
