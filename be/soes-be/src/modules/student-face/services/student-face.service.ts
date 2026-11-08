import { Prisma } from '@prisma/client'
import { faceVerificationConfig } from '../../../config'
import { ConflictError, ForbiddenError, NotFoundError } from '../../../errors/AppError'
import prisma from '../../../lib/prisma'
import { writeAuditLog } from '../../audit-logs/audit-log.writer'
import { findEnrollment, findScheduleById, findActiveAttempt } from '../../student-take-exam/repositories/student-take-exam.repository'
import * as repository from '../repositories/student-face.repository'
import * as provider from './face-provider'
import { nextFaceRetryState } from './face-retry.policy'

export async function getProfile(studentId: string) {
  const profile = await repository.findFaceProfile(studentId)
  return {
    enabled: faceVerificationConfig.enabled,
    enrolled: profile?.status === 'ACTIVE',
    failedAttemptsSinceSuccess: profile?.failedAttemptsSinceSuccess ?? 0,
    cooldownUntil: profile?.cooldownUntil ?? null,
    requiresManualReview: profile?.requiresManualReview ?? false,
  }
}

export async function getManualApproval(studentId: string, scheduleId: string) {
  const grant = await repository.findManualApproval(studentId, scheduleId)
  return grant
}

export async function getPendingManualReviews(teacherId: string, scheduleId: string) {
  if (!faceVerificationConfig.enabled) return []
  const profiles = await repository.findPendingManualReviews(teacherId, scheduleId)
  return profiles.map(({ studentId, failedAttemptsSinceSuccess, student }) => ({
    studentId, studentCode: student.studentCode, studentName: student.user.fullName,
    failedAttempts: failedAttemptsSinceSuccess,
  }))
}

export async function createSession(studentId: string, purpose: 'ENROLLMENT' | 'EXAM_ENTRY', scheduleId?: string) {
  if (!faceVerificationConfig.enabled) throw new ConflictError('Face verification is not enabled')
  const profile = await repository.findFaceProfile(studentId)
  if (purpose === 'ENROLLMENT') {
    if (profile?.status === 'ACTIVE') throw new ConflictError('Face is already enrolled')
  } else {
    if (!scheduleId) throw new ConflictError('Exam schedule is required')
    if (profile?.status !== 'ACTIVE') throw new ForbiddenError('Register your face before entering an exam')
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

  const providerSessionId = await provider.createLivenessSession()
  const session = await repository.createFaceSession(studentId, purpose, providerSessionId,
    new Date(Date.now() + faceVerificationConfig.sessionTtlSeconds * 1000), scheduleId)
  return { id: session.id, providerSessionId, expiresAt: session.expiresAt, region: faceVerificationConfig.region }
}

async function recordFailure(id: string, studentId: string, actorUserId: string, purpose: 'ENROLLMENT' | 'EXAM_ENTRY', code: string) {
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
        data: retryState,
      })
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
    if (result.status !== 'SUCCEEDED' || result.confidence < faceVerificationConfig.livenessThreshold || !result.image) {
      const profile = await recordFailure(id, studentId, actorUserId, session.purpose, 'LIVENESS_FAILED')
      return { status: 'FAILED' as const, ...profile }
    }

    if (session.purpose === 'ENROLLMENT') {
      const existing = await repository.findFaceProfile(studentId)
      if (existing?.status === 'ACTIVE') throw new ConflictError('Face is already enrolled')
      const faceId = await provider.indexStudentFace(studentId, result.image)
      try {
        await prisma.$transaction(async (tx) => {
          await tx.studentFaceProfile.upsert({
            where: { studentId },
            create: { studentId, providerUserId: studentId, collectionId: faceVerificationConfig.collectionId, status: 'ACTIVE', enrolledAt: new Date() },
            update: { providerUserId: studentId, collectionId: faceVerificationConfig.collectionId, status: 'ACTIVE', enrolledAt: new Date(), revokedAt: null },
          })
          await tx.faceVerificationSession.update({ where: { id }, data: { status: 'PASSED', livenessConfidence: new Prisma.Decimal(result.confidence), completedAt: new Date() } })
          await writeAuditLog(tx, { userId: actorUserId, action: 'FACE_ENROLLED', entityType: 'StudentFaceProfile', entityId: studentId })
        })
      } catch (error) {
        await provider.deleteStudentFace(faceId).catch(() => undefined)
        throw error
      }
      return { status: 'PASSED' as const }
    }

    const similarity = await provider.matchStudentFace(studentId, result.image)
    if (similarity < faceVerificationConfig.similarityThreshold) {
      const profile = await recordFailure(id, studentId, actorUserId, session.purpose, 'FACE_MISMATCH')
      return { status: 'FAILED' as const, ...profile }
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
      await tx.studentFaceProfile.update({ where: { studentId }, data: { failedAttemptsSinceSuccess: 0, cooldownUntil: null, requiresManualReview: false } })
      await writeAuditLog(tx, { userId: actorUserId, action: 'FACE_VERIFICATION_PASSED', entityType: 'FaceVerificationSession', entityId: id, metadata: { scheduleId: session.examScheduleId } })
    })
    return { status: 'PASSED' as const, id, scheduleId: session.examScheduleId }
  } catch (error) {
    await repository.transitionFaceSession(id, 'PROCESSING', 'CREATED')
    throw error
  }
}

export async function approveManualEntry(teacherId: string, actorUserId: string, scheduleId: string, studentId: string, reason: string) {
  if (!faceVerificationConfig.enabled) throw new ConflictError('Face verification is not enabled')
  const enrollment = await findEnrollment(scheduleId, studentId)
  if (!enrollment) throw new NotFoundError('Student is not assigned to this exam')
  const assignment = await repository.findAssignedProctor(teacherId, scheduleId, enrollment.courseOfferingId)
  if (!assignment) throw new ForbiddenError('Only an assigned proctor may approve face verification')
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
