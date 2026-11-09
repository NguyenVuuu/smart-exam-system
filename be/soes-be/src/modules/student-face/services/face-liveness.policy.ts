type Purpose = 'ENROLLMENT' | 'EXAM_ENTRY'
type LivenessResult = { status: string | undefined; confidence: number; image?: Uint8Array }
type Thresholds = { enrollmentLivenessThreshold: number; livenessThreshold: number }
type FaceDetail = { FaceOccluded?: { Value?: boolean; Confidence?: number } }
type FaceInspection = { reference: FaceDetail[]; audit: FaceDetail[][] }
const minimumClearFaceConfidence = 80

export function assessLiveness(purpose: Purpose, result: LivenessResult, thresholds: Thresholds) {
  if (result.status !== 'SUCCEEDED') return { accepted: false as const, failureCode: 'LIVENESS_NOT_COMPLETED' }
  const minimum = purpose === 'ENROLLMENT' ? thresholds.enrollmentLivenessThreshold : thresholds.livenessThreshold
  if (result.confidence < minimum) return { accepted: false as const, failureCode: 'LIVENESS_LOW_CONFIDENCE' }
  if (!result.image) return { accepted: false as const, failureCode: 'LIVENESS_REFERENCE_IMAGE_MISSING' }
  return { accepted: true as const, image: result.image }
}

export function assessFaceVisibility({ reference, audit }: FaceInspection) {
  if (reference.length !== 1) return { accepted: false as const, failureCode: 'FACE_NOT_CLEAR' as const }
  if (reference[0].FaceOccluded?.Value === true) return { accepted: false as const, failureCode: 'FACE_OBSTRUCTED' as const }
  if (reference[0].FaceOccluded?.Value !== false || (reference[0].FaceOccluded.Confidence ?? 0) < minimumClearFaceConfidence) {
    return { accepted: false as const, failureCode: 'FACE_NOT_CLEAR' as const }
  }
  for (const [auditImageIndex, faces] of audit.entries()) {
    if (faces.length !== 1) return { accepted: false as const, failureCode: 'FACE_NOT_CLEAR' as const, auditImageIndex }
    if (faces[0].FaceOccluded?.Value === true) return { accepted: false as const, failureCode: 'FACE_OBSTRUCTED' as const, auditImageIndex }
    if (faces[0].FaceOccluded?.Value !== false || (faces[0].FaceOccluded.Confidence ?? 0) < minimumClearFaceConfidence) {
      return { accepted: false as const, failureCode: 'FACE_NOT_CLEAR' as const, auditImageIndex }
    }
  }
  return { accepted: true as const }
}
