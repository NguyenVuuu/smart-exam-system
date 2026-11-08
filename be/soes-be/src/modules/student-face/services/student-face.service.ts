import { Prisma } from '@prisma/client'
import { faceVerificationConfig } from '../../../config'
import { ConflictError, ForbiddenError, NotFoundError } from '../../../errors/AppError'
import prisma from '../../../lib/prisma'
import { writeAuditLog } from '../../audit-logs/audit-log.writer'
import { findEnrollment, findScheduleById, findActiveAttempt } from '../../student-take-exam/repositories/student-take-exam.repository'
import * as repository from '../repositories/student-face.repository'
import * as provider from './face-provider'
import { assessLiveness } from './face-liveness.policy'
import { nextFaceRetryState } from './face-retry.policy'
import { decryptFaceImage, encryptFaceImage, enrollmentImageContext, failedImageContext, imageMimeType } from './face-image.crypto'

export async function getProfile(studentId: string) {
  const profile = await repository.findFaceProfile(studentId)
  return {
    enabled: faceVerificationConfig.enabled,
    enrolled: profile?.status === 'ACTIVE',
    failedAttemptsSinceSuccess: profile?.failedAttemptsSinceSuccess ?? 0,
    cooldownUntil: profile?.cooldownUntil ?? null,
    requiresManualReview: profile?.requiresManualReview ?? false,
    imageRetentionConsented: !!profile?.imageConsentAt,
  }
}

export async function getManualApproval(studentId: string, scheduleId: string) {
  const grant = await repository.findManualApproval(studentId, scheduleId)
  return grant
}

export async function getPendingManualReviews(teacherId: string, scheduleId: string) {
  if (!faceVerificationConfig.enabled) return []
  const profiles = await repository.findPendingManualReviews(teacherId, scheduleId)
  const captures = await prisma.faceReviewCapture.findMany({
    where: { examScheduleId: scheduleId, studentId: { in: profiles.map(({ studentId }) => studentId) }, expiresAt: { gt: new Date() } },
    select: { studentId: true, capturedAt: true },
  })
  const capturesByStudent = new Map(captures.map((capture) => [capture.studentId, capture.capturedAt]))
  return profiles.map(({ studentId, failedAttemptsSinceSuccess, student, referenceImageCapturedAt }) => ({
    studentId, studentCode: student.studentCode, studentName: student.user.fullName,
    failedAttempts: failedAttemptsSinceSuccess,
    enrollmentImageAvailable: !!referenceImageCapturedAt,
    latestFailedImageAt: capturesByStudent.get(studentId) ?? null,
  }))
}

export async function createSession(studentId: string, purpose: 'ENROLLMENT' | 'EXAM_ENTRY', scheduleId?: string, retainImageConsent = false) {
  if (!faceVerificationConfig.enabled) throw new ConflictError('Face verification is not enabled')
  const profile = await repository.findFaceProfile(studentId)
  if (purpose === 'ENROLLMENT') {
    if (profile?.status === 'ACTIVE') throw new ConflictError('Face is already enrolled')
    if (!retainImageConsent) throw new ForbiddenError('Consent to retain the enrollment image is required')
  } else {
    if (!scheduleId) throw new ConflictError('Exam schedule is required')
    if (profile?.status !== 'ACTIVE') throw new ForbiddenError('Register your face before entering an exam')
    if (!profile.imageConsentAt && !retainImageConsent) throw new ForbiddenError('Consent to retain the latest failed exam scan is required')
    if (profile.requiresManualReview) throw new ForbiddenError('Proctor approval is required')
    if (profile.cooldownUntil && profile.cooldownUntil > new Date()) throw new ForbiddenError('Face verification is temporarily paused')
    const [schedule, enrollment] = await Promise.all([
      findScheduleById(scheduleId), findEnrollment(scheduleId, studentId),
    ])
    if (!schedule || !enrollment) throw new NotFoundError('Exam schedule not found')
    const activeAttempt = await findActiveAttempt(scheduleId, studentId)
    if (!schedule.publishedAt || new Date() < schedule.startTime || (new Date() >= schedule.endTime && (!activeAttempt || activeAttempt.deadlineAt <= new Date()))) {
      throw new ConflictError('Exam is not open')
    }
  }

  const pending = await repository.countPendingSessions(studentId, purpose, scheduleId)
  if (pending >= 2) throw new ConflictError('Complete the current face verification first')
  const recent = await repository.countRecentSessions(studentId, new Date(Date.now() - 15 * 60 * 1000))
  if (recent >= 12) throw new ForbiddenError('Too many face verification sessions. Please try again later')

  const providerSessionId = await provider.createLivenessSession(purpose)
  const session = await repository.createFaceSession(studentId, purpose, providerSessionId,
    new Date(Date.now() + faceVerificationConfig.sessionTtlSeconds * 1000), scheduleId, retainImageConsent ? new Date() : null)
  return { id: session.id, providerSessionId, expiresAt: session.expiresAt, region: faceVerificationConfig.region }
}

async function recordFailure(id: string, studentId: string, actorUserId: string, purpose: 'ENROLLMENT' | 'EXAM_ENTRY', code: string, scheduleId?: string | null, image?: Uint8Array, imageConsentAt?: Date | null) {
  const mimeType = image ? imageMimeType(image) : null
  const ciphertext = purpose === 'EXAM_ENTRY' && scheduleId && mimeType && image
    ? encryptFaceImage(image, failedImageContext(studentId, scheduleId)) : null
  await prisma.$transaction(async (tx) => {
    await tx.faceVerificationSession.update({ where: { id }, data: { status: 'FAILED', failureCode: code, completedAt: new Date() } })
    let retryState: ReturnType<typeof nextFaceRetryState> | null = null
    if (purpose === 'EXAM_ENTRY') {
      const [profile] = await tx.$queryRaw<{ failedAttemptsSinceSuccess: number }[]>`
        SELECT "failedAttemptsSinceSuccess" FROM "StudentFaceProfile"
        WHERE "studentId" = ${studentId} FOR UPDATE
      `
      if (!profile) throw new NotFoundError('Face profile not found')
      retryState = nextFaceRetryState(profile.failedAttemptsSinceSuccess, new Date(), faceVerificationConfig)
      await tx.studentFaceProfile.update({
        where: { studentId },
        data: { ...retryState, ...(imageConsentAt ? { imageConsentAt } : {}) },
      })
      if (scheduleId) {
        await tx.faceReviewCapture.deleteMany({ where: { studentId, examScheduleId: scheduleId } })
        if (ciphertext && mimeType) await tx.faceReviewCapture.create({ data: {
          studentId, examScheduleId: scheduleId, sourceSessionId: id, imageCiphertext: ciphertext,
          imageMimeType: mimeType, capturedAt: new Date(),
          expiresAt: new Date(Date.now() + faceVerificationConfig.reviewImageRetentionDays * 86400_000),
        } })
      }
    }
    await writeAuditLog(tx, { userId: actorUserId, action: 'FACE_VERIFICATION_FAILED', entityType: 'FaceVerificationSession', entityId: id,
      metadata: { purpose, code, failedAttempts: retryState?.failedAttemptsSinceSuccess,
        requiresManualReview: retryState?.requiresManualReview, cooldownUntil: retryState?.cooldownUntil?.toISOString() } })
  })
  return getProfile(studentId)
}

export async function completeSession(studentId: string, id: string, actorUserId: string) {
  if (!faceVerificationConfig.enabled) throw new ConflictError('Face verification is not enabled')
  const session = await repository.findFaceSession(studentId, id)
  if (!session) throw new NotFoundError('Face verification session not found')
  if (session.status !== 'CREATED') throw new ConflictError('Face verification session was already used')
  if (session.expiresAt <= new Date()) {
    await repository.transitionFaceSession(id, 'CREATED', 'EXPIRED')
    throw new ConflictError('Face verification session expired')
  }
  const claimed = await repository.transitionFaceSession(id, 'CREATED', 'PROCESSING')
  if (!claimed.count) throw new ConflictError('Face verification session was already used')

  try {
    if (session.purpose === 'EXAM_ENTRY') {
      const profile = await repository.findFaceProfile(studentId)
      if (!profile) throw new NotFoundError('Face profile not found')
      if (!profile.imageConsentAt && !session.imageConsentAt) throw new ForbiddenError('Consent to retain the latest failed exam scan is required')
      if (profile.requiresManualReview) throw new ForbiddenError('Proctor approval is required')
      if (profile.cooldownUntil && profile.cooldownUntil > new Date()) throw new ForbiddenError('Face verification is temporarily paused')
    }
    const result = await provider.getLivenessResult(session.providerSessionId!)
    if (session.expiresAt <= new Date()) {
      await repository.transitionFaceSession(id, 'PROCESSING', 'EXPIRED')
      throw new ConflictError('Face verification session expired')
    }
    if (result.status === 'CREATED' || result.status === 'IN_PROGRESS') {
      await repository.transitionFaceSession(id, 'PROCESSING', 'CREATED')
      return { status: 'PROCESSING' as const }
    }
    const assessment = assessLiveness(session.purpose, result, faceVerificationConfig)
    if (!assessment.accepted) {
      const profile = await recordFailure(id, studentId, actorUserId, session.purpose, assessment.failureCode, session.examScheduleId, result.reviewImage, session.imageConsentAt)
      return { status: 'FAILED' as const, failureCode: assessment.failureCode, feedbackCodes: result.feedbackCodes, ...profile }
    }

    if (session.purpose === 'ENROLLMENT') {
      if (!session.imageConsentAt) throw new ForbiddenError('Consent to retain the enrollment image is required')
      const existing = await repository.findFaceProfile(studentId)
      if (existing?.status === 'ACTIVE') throw new ConflictError('Face is already enrolled')
      const mimeType = imageMimeType(assessment.image)
      const ciphertext = faceVerificationConfig.provider === 'mock' ? null : encryptFaceImage(assessment.image, enrollmentImageContext(studentId))
      const faceId = await provider.indexStudentFace(studentId, assessment.image)
      try {
        await prisma.$transaction(async (tx) => {
          await tx.$queryRaw`SELECT "id" FROM "Student" WHERE "id" = ${studentId} FOR UPDATE`
          const current = await tx.studentFaceProfile.findUnique({ where: { studentId }, select: { status: true } })
          if (current?.status === 'ACTIVE') throw new ConflictError('Face is already enrolled')
          if (session.expiresAt <= new Date()) throw new ConflictError('Face verification session expired')
          await tx.studentFaceProfile.upsert({
            where: { studentId },
            create: { studentId, providerUserId: studentId, providerFaceId: faceId, collectionId: faceVerificationConfig.collectionId, status: 'ACTIVE', enrolledAt: new Date(), imageConsentAt: session.imageConsentAt, referenceImageCiphertext: ciphertext, referenceImageMimeType: mimeType, referenceImageCapturedAt: ciphertext ? new Date() : null },
            update: { providerUserId: studentId, providerFaceId: faceId, collectionId: faceVerificationConfig.collectionId, status: 'ACTIVE', enrolledAt: new Date(), revokedAt: null, imageConsentAt: session.imageConsentAt, referenceImageCiphertext: ciphertext, referenceImageMimeType: mimeType, referenceImageCapturedAt: ciphertext ? new Date() : null },
          })
          await tx.faceVerificationSession.update({ where: { id }, data: { status: 'PASSED', livenessConfidence: new Prisma.Decimal(result.confidence), completedAt: new Date() } })
          await writeAuditLog(tx, { userId: actorUserId, action: 'FACE_ENROLLED', entityType: 'StudentFaceProfile', entityId: studentId })
        })
      } catch (error) {
        try {
          await provider.deleteStudentFace(faceId)
        } catch (cleanupError) {
          throw new Error('Face index cleanup failed after enrollment transaction', { cause: cleanupError })
        }
        throw error
      }
      return { status: 'PASSED' as const }
    }

    const similarity = await provider.matchStudentFace(studentId, assessment.image)
    if (similarity < faceVerificationConfig.similarityThreshold) {
      const profile = await recordFailure(id, studentId, actorUserId, session.purpose, 'FACE_MISMATCH', session.examScheduleId, assessment.image, session.imageConsentAt)
      return { status: 'FAILED' as const, failureCode: 'FACE_MISMATCH', ...profile }
    }
    await prisma.$transaction(async (tx) => {
      const [profile] = await tx.$queryRaw<{ status: string; cooldownUntil: Date | null; requiresManualReview: boolean }[]>`
        SELECT "status", "cooldownUntil", "requiresManualReview" FROM "StudentFaceProfile"
        WHERE "studentId" = ${studentId} FOR UPDATE
      `
      if (profile?.status !== 'ACTIVE' || profile.requiresManualReview || (profile.cooldownUntil && profile.cooldownUntil > new Date())) {
        throw new ForbiddenError('Face verification is temporarily unavailable')
      }
      if (session.expiresAt <= new Date()) throw new ConflictError('Face verification session expired')
      await tx.faceVerificationSession.update({
        where: { id }, data: {
          status: 'PASSED', livenessConfidence: new Prisma.Decimal(result.confidence), similarity: new Prisma.Decimal(similarity),
          completedAt: new Date(), grantExpiresAt: new Date(Date.now() + faceVerificationConfig.grantTtlSeconds * 1000),
        },
      })
      await tx.studentFaceProfile.update({ where: { studentId }, data: { failedAttemptsSinceSuccess: 0, cooldownUntil: null, requiresManualReview: false, ...(session.imageConsentAt ? { imageConsentAt: session.imageConsentAt } : {}) } })
      await tx.faceReviewCapture.deleteMany({ where: { studentId, examScheduleId: session.examScheduleId! } })
      await writeAuditLog(tx, { userId: actorUserId, action: 'FACE_VERIFICATION_PASSED', entityType: 'FaceVerificationSession', entityId: id, metadata: { scheduleId: session.examScheduleId } })
    })
    return { status: 'PASSED' as const, id, scheduleId: session.examScheduleId }
  } catch (error) {
    await repository.transitionFaceSession(id, 'PROCESSING', 'CREATED')
    throw error
  }
}

export async function cancelSession(studentId: string, id: string, actorUserId: string) {
  if (!faceVerificationConfig.enabled) throw new ConflictError('Face verification is not enabled')
  const session = await repository.findFaceSession(studentId, id)
  if (!session) throw new NotFoundError('Face verification session not found')
  await prisma.$transaction(async (tx) => {
    const cancelled = await repository.cancelFaceSession(tx, studentId, id)
    if (!cancelled.count) throw new ConflictError('Face verification session can no longer be cancelled')
    await writeAuditLog(tx, { userId: actorUserId, action: 'FACE_SESSION_CANCELLED',
      entityType: 'FaceVerificationSession', entityId: id, metadata: { purpose: session.purpose } })
  })
  return { cancelled: true }
}

export async function approveManualEntry(teacherId: string, actorUserId: string, scheduleId: string, studentId: string, reason: string) {
  if (!faceVerificationConfig.enabled) throw new ConflictError('Face verification is not enabled')
  const enrollment = await findEnrollment(scheduleId, studentId)
  if (!enrollment) throw new NotFoundError('Student is not assigned to this exam')
  const assignment = await repository.findAssignedProctor(teacherId, scheduleId, enrollment.courseOfferingId)
  if (!assignment) throw new ForbiddenError('Only an assigned proctor may approve face verification')
  const failedInSchedule = await prisma.faceVerificationSession.count({ where: { studentId, examScheduleId: scheduleId, purpose: 'EXAM_ENTRY', status: 'FAILED' } })
  if (!failedInSchedule) throw new ConflictError('No failed face verification in this exam')
  const schedule = await findScheduleById(scheduleId)
  const activeAttempt = await findActiveAttempt(scheduleId, studentId)
  const now = new Date()
  if (!schedule?.publishedAt || now < schedule.startTime || (now >= schedule.endTime && (!activeAttempt || activeAttempt.deadlineAt <= now))) {
    throw new ConflictError('Exam is not open')
  }
  return prisma.$transaction(async (tx) => {
    const [profile] = await tx.$queryRaw<{ status: string; requiresManualReview: boolean }[]>`
      SELECT "status", "requiresManualReview" FROM "StudentFaceProfile"
      WHERE "studentId" = ${studentId} FOR UPDATE
    `
    if (profile?.status !== 'ACTIVE' || !profile.requiresManualReview) {
      throw new ConflictError('Manual approval is only available after repeated face verification failures')
    }
    const existing = await tx.faceVerificationSession.findFirst({
      where: { studentId, examScheduleId: scheduleId, method: 'MANUAL_OVERRIDE',
        status: 'MANUAL_APPROVED', grantExpiresAt: { gt: now } },
      select: { id: true },
    })
    if (existing) throw new ConflictError('An active manual approval already exists')
    const grant = await tx.faceVerificationSession.create({
      data: {
        studentId, examScheduleId: scheduleId, purpose: 'EXAM_ENTRY', method: 'MANUAL_OVERRIDE',
        status: 'MANUAL_APPROVED', approvedById: actorUserId, manualReason: reason,
        completedAt: now,
        expiresAt: new Date(now.getTime() + faceVerificationConfig.grantTtlSeconds * 1000),
        grantExpiresAt: new Date(now.getTime() + faceVerificationConfig.grantTtlSeconds * 1000),
      },
      select: { id: true, grantExpiresAt: true },
    })
    await writeAuditLog(tx, {
      userId: actorUserId, action: 'FACE_MANUAL_ENTRY_APPROVED', entityType: 'FaceVerificationSession', entityId: grant.id,
      metadata: { scheduleId, studentId, reason },
    })
    return grant
  })
}

export async function getManualReviewImage(teacherId: string, actorUserId: string, scheduleId: string, studentId: string, kind: 'enrollment' | 'latest-failed') {
  if (!faceVerificationConfig.enabled) throw new ConflictError('Face verification is not enabled')
  const enrollment = await findEnrollment(scheduleId, studentId)
  if (!enrollment) throw new NotFoundError('Student is not assigned to this exam')
  const assignment = await repository.findAssignedProctor(teacherId, scheduleId, enrollment.courseOfferingId)
  if (!assignment) throw new ForbiddenError('Only an assigned proctor may view face review images')
  const failedInSchedule = await prisma.faceVerificationSession.count({ where: { studentId, examScheduleId: scheduleId, purpose: 'EXAM_ENTRY', status: 'FAILED' } })
  if (!failedInSchedule) throw new ForbiddenError('No pending face review in this exam')
  const activeApproval = await prisma.faceVerificationSession.count({ where: {
    studentId, examScheduleId: scheduleId, method: 'MANUAL_OVERRIDE', status: 'MANUAL_APPROVED', grantExpiresAt: { gt: new Date() },
  } })
  if (activeApproval) throw new ForbiddenError('Face review has already been approved')
  const profile = await prisma.studentFaceProfile.findUnique({
    where: { studentId }, select: { status: true, requiresManualReview: true,
      ...(kind === 'enrollment' ? { referenceImageCiphertext: true, referenceImageMimeType: true } : {}),
    },
  })
  if (profile?.status !== 'ACTIVE' || !profile.requiresManualReview) throw new ForbiddenError('No pending face review')
  const capture = kind === 'latest-failed' ? await prisma.faceReviewCapture.findUnique({
    where: { studentId_examScheduleId: { studentId, examScheduleId: scheduleId } },
    select: { imageCiphertext: true, imageMimeType: true, expiresAt: true },
  }) : null
  const encrypted = kind === 'enrollment' ? ('referenceImageCiphertext' in profile ? profile.referenceImageCiphertext : null) : capture?.expiresAt && capture.expiresAt > new Date() ? capture.imageCiphertext : null
  const mimeType = kind === 'enrollment' ? ('referenceImageMimeType' in profile ? profile.referenceImageMimeType : null) : capture?.imageMimeType
  if (!encrypted || !mimeType || !['image/jpeg', 'image/png'].includes(mimeType)) throw new NotFoundError('Face review image is unavailable')
  const bytes = decryptFaceImage(encrypted, kind === 'enrollment' ? enrollmentImageContext(studentId) : failedImageContext(studentId, scheduleId))
  await writeAuditLog(prisma, { userId: actorUserId, action: 'FACE_REVIEW_IMAGE_VIEWED', entityType: 'StudentFaceProfile', entityId: studentId,
    metadata: { scheduleId, kind } })
  return { bytes, mimeType }
}
