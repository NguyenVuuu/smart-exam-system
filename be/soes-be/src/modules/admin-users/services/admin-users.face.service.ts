import { ConflictError, NotFoundError } from '../../../errors/AppError'
import { decryptFaceImage, enrollmentImageContext } from '../../student-face/services/face-image.crypto'
import { deleteStudentFace } from '../../student-face/services/face-provider'
import * as repo from '../repositories/admin-users.face.repository'

export async function getEnrollmentImage(studentId: string, actorUserId: string) {
  const profile = await repo.findEnrollmentImage(studentId)
  if (profile?.status !== 'ACTIVE' || !profile.referenceImageCiphertext ||
    !profile.referenceImageMimeType || !['image/jpeg', 'image/png'].includes(profile.referenceImageMimeType)) {
    throw new NotFoundError('Face enrollment image is unavailable')
  }
  const bytes = decryptFaceImage(profile.referenceImageCiphertext, enrollmentImageContext(studentId))
  await repo.auditImageView(studentId, actorUserId)
  return { bytes, mimeType: profile.referenceImageMimeType }
}

export async function revokeEnrollment(studentId: string, actorUserId: string, reason: string) {
  const { faceId, collectionId } = await repo.markEnrollmentRevoked(studentId, actorUserId, reason)
  try {
    if (faceId) await deleteStudentFace(faceId, collectionId)
  } catch (error) {
    throw new ConflictError('Face enrollment was blocked, but AWS cleanup failed. Retry the revocation.')
  }
  await repo.finishEnrollmentRevocation(studentId, faceId)
  return { revoked: true }
}
