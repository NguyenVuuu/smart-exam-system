import { ConflictError, NotFoundError } from '../../../errors/AppError'
import * as repo from '../repositories/attempt-violation.repository'
import * as live from '../../proctoring-live/proctoring-live.service'
import { emitAttemptEvent } from '../../proctoring/proctoring-realtime.events'

export async function requireLiveAttempt(scheduleId: string, attemptId: string, studentId: string) {
  const attempt = await repo.findAttemptForViolation(attemptId, scheduleId, studentId)
  if (!attempt) throw new NotFoundError('Attempt not found')
  const now = new Date()
  if (attempt.status !== 'IN_PROGRESS' || now >= attempt.deadlineAt) {
    throw new ConflictError('Exam attempt has ended')
  }
  return attempt
}

export async function getPendingLiveCameraRequest(scheduleId: string, attemptId: string, studentId: string) {
  await requireLiveAttempt(scheduleId, attemptId, studentId)
  return live.getPendingStudentRequest(attemptId, scheduleId)
}

export async function submitLiveCameraOffer(
  scheduleId: string,
  attemptId: string,
  studentId: string,
  sessionId: string,
  offer: Record<string, unknown>,
) {
  await requireLiveAttempt(scheduleId, attemptId, studentId)
  const session = await live.submitStudentOffer({ scheduleId, attemptId, sessionId, offer })
  if (!session) throw new NotFoundError('Live session not found')
  return session
}

export async function getStudentLiveSession(scheduleId: string, attemptId: string, studentId: string, sessionId: string) {
  await requireLiveAttempt(scheduleId, attemptId, studentId)
  const session = await live.getStudentLiveSession(sessionId, attemptId, scheduleId)
  if (!session) throw new NotFoundError('Live session not found')
  return session
}

export async function addStudentLiveCandidate(
  scheduleId: string,
  attemptId: string,
  studentId: string,
  sessionId: string,
  candidate: Record<string, unknown>,
) {
  await requireLiveAttempt(scheduleId, attemptId, studentId)
  const result = await live.addStudentCandidate({ scheduleId, attemptId, sessionId, candidate })
  if (!result) throw new NotFoundError('Live session not found')
  return result
}

export async function getStudentLiveCandidates(
  scheduleId: string,
  attemptId: string,
  studentId: string,
  sessionId: string,
  from: number,
) {
  await requireLiveAttempt(scheduleId, attemptId, studentId)
  const result = await live.getTeacherCandidates(sessionId, attemptId, scheduleId, from)
  if (!result) throw new NotFoundError('Live session not found')
  return result
}

export async function endStudentLiveSession(scheduleId: string, attemptId: string, studentId: string, sessionId: string) {
  await requireLiveAttempt(scheduleId, attemptId, studentId)
  const session = await live.endLiveSession(sessionId, { attemptId, scheduleId })
  if (!session) throw new NotFoundError('Live session not found')
  emitAttemptEvent(attemptId, 'live:ended', session)
  return session
}
