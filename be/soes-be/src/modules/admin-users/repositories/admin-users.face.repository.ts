import prisma from '../../../lib/prisma'
import { ConflictError, NotFoundError } from '../../../errors/AppError'
import { writeAuditLog } from '../../audit-logs/audit-log.writer'

export const findEnrollmentImage = (studentId: string) => prisma.studentFaceProfile.findUnique({
  where: { studentId },
  select: { status: true, referenceImageCiphertext: true, referenceImageMimeType: true },
})

export const auditImageView = (studentId: string, actorUserId: string) => writeAuditLog(prisma, {
  userId: actorUserId, action: 'FACE_ENROLLMENT_IMAGE_VIEWED',
  entityType: 'StudentFaceProfile', entityId: studentId,
})

export async function markEnrollmentRevoked(studentId: string, actorUserId: string, reason: string) {
  return prisma.$transaction(async (tx) => {
    const [student] = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "Student" WHERE "id" = ${studentId} FOR UPDATE
    `
    if (!student) throw new NotFoundError('Student not found')
    const profile = await tx.studentFaceProfile.findUnique({
      where: { studentId }, select: { status: true, providerFaceId: true, collectionId: true },
    })
    if (!profile || profile.status === 'PENDING' || (profile.status === 'REVOKED' && !profile.providerFaceId)) {
      throw new ConflictError('Student has no active face enrollment')
    }
    const now = new Date()
    if (profile.status === 'ACTIVE') {
      await tx.studentFaceProfile.update({ where: { studentId }, data: {
        status: 'REVOKED', revokedAt: now, failedAttemptsSinceSuccess: 0,
        cooldownUntil: null, requiresManualReview: false, referenceImageCiphertext: null,
        referenceImageMimeType: null, referenceImageCapturedAt: null,
      } })
      await tx.faceVerificationSession.updateMany({
        where: { studentId, purpose: 'EXAM_ENTRY', grantExpiresAt: { gt: now } },
        data: { grantExpiresAt: now },
      })
      await tx.faceVerificationSession.updateMany({
        where: { studentId, purpose: 'EXAM_ENTRY', status: 'CONSUMED', contentAccessedAt: { not: null } },
        data: { contentAccessedAt: null },
      })
      await tx.faceVerificationSession.updateMany({
        where: { studentId, status: { in: ['CREATED', 'PROCESSING'] } },
        data: { status: 'EXPIRED' },
      })
      await tx.faceReviewCapture.deleteMany({ where: { studentId } })
      await writeAuditLog(tx, {
        userId: actorUserId, action: 'FACE_ENROLLMENT_REVOKED',
        entityType: 'StudentFaceProfile', entityId: studentId, metadata: { reason },
      })
    }
    return { faceId: profile.providerFaceId, collectionId: profile.collectionId }
  })
}

export async function finishEnrollmentRevocation(studentId: string, faceId: string | null) {
  if (!faceId) return
  await prisma.studentFaceProfile.updateMany({
    where: { studentId, status: 'REVOKED', providerFaceId: faceId },
    data: { providerFaceId: null },
  })
}
