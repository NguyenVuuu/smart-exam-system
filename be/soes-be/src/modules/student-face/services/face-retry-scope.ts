import { Prisma } from '@prisma/client'
import { faceVerificationConfig } from '../../../config'
import { nextFaceRetryState } from './face-retry.policy'

type RetryDb = Pick<Prisma.TransactionClient, 'examAttempt' | 'faceVerificationSession'>

export async function retryWindowStart(db: RetryDb, studentId: string, scheduleId: string) {
  const now = new Date()
  const previousAttempt = await db.examAttempt.findFirst({
    where: { studentId, examScheduleId: scheduleId,
      OR: [{ submittedAt: { not: null } }, { deadlineAt: { lte: now } }] },
    orderBy: { attemptNo: 'desc' }, select: { submittedAt: true, deadlineAt: true },
  })
  return previousAttempt ? previousAttempt.submittedAt ?? previousAttempt.deadlineAt : null
}

export async function examRetryState(db: RetryDb, studentId: string, scheduleId: string) {
  const windowStart = await retryWindowStart(db, studentId, scheduleId)
  const lastPassed = await db.faceVerificationSession.findFirst({
    where: { studentId, examScheduleId: scheduleId, purpose: 'EXAM_ENTRY', status: { in: ['PASSED', 'CONSUMED'] },
      ...(windowStart ? { completedAt: { gt: windowStart } } : {}) },
    orderBy: { completedAt: 'desc' }, select: { completedAt: true },
  })
  const since = lastPassed?.completedAt && (!windowStart || lastPassed.completedAt > windowStart)
    ? lastPassed.completedAt : windowStart
  const where: Prisma.FaceVerificationSessionWhereInput = {
    studentId, examScheduleId: scheduleId, purpose: 'EXAM_ENTRY', status: 'FAILED',
    failureCode: { not: 'CLIENT_CANCELLED' },
    ...(since ? { completedAt: { gt: since } } : {}),
  }
  const [failures, latestFailure] = await Promise.all([
    db.faceVerificationSession.count({ where }),
    db.faceVerificationSession.findFirst({ where, orderBy: { completedAt: 'desc' }, select: { completedAt: true } }),
  ])
  const state = failures && latestFailure?.completedAt
    ? nextFaceRetryState(failures - 1, latestFailure.completedAt, faceVerificationConfig)
    : { failedAttemptsSinceSuccess: 0, cooldownUntil: null, requiresManualReview: false }
  if (failures >= faceVerificationConfig.failuresPerCycle && !state.requiresManualReview) {
    const firstCycleEnd = await db.faceVerificationSession.findFirst({
      where, orderBy: { completedAt: 'asc' }, skip: faceVerificationConfig.failuresPerCycle - 1,
      select: { completedAt: true },
    })
    state.cooldownUntil = firstCycleEnd?.completedAt
      ? new Date(firstCycleEnd.completedAt.getTime() + faceVerificationConfig.cooldownSeconds * 1000) : null
  }
  return { ...state, windowStart }
}
