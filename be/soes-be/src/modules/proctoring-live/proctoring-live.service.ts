import { randomUUID } from 'crypto'
import { changeLiveSession, createLiveSession, pendingSessionId, type LiveSession, type LiveStreamType } from './live-session.store'

export type { LiveStreamType } from './live-session.store'
type JsonSignal = Record<string, unknown>

function publicSession(session: LiveSession) {
  return {
    id: session.id, attemptId: session.attemptId, scheduleId: session.scheduleId,
    teacherId: session.teacherId, streamType: session.streamType, status: session.status,
    offer: session.offer, answer: session.answer,
    studentCandidateCount: session.studentCandidates.length,
    teacherCandidateCount: session.teacherCandidates.length,
    updatedAt: new Date(session.updatedAt).toISOString(),
  }
}

export async function requestLiveStream(input: { attemptId: string; scheduleId: string; teacherId: string; streamType: LiveStreamType }) {
  const now = Date.now()
  return publicSession(await createLiveSession({
    ...input, id: randomUUID(), createdAt: now, updatedAt: now, status: 'REQUESTED',
    offer: null, answer: null, studentCandidates: [], teacherCandidates: [],
  }))
}

export const requestLiveCamera = (input: { attemptId: string; scheduleId: string; teacherId: string }) =>
  requestLiveStream({ ...input, streamType: 'WEBCAM' })

export async function getPendingStudentRequest(attemptId: string, scheduleId: string, streamType?: LiveStreamType) {
  const sessionId = streamType ? await pendingSessionId(attemptId, scheduleId, streamType)
    : await pendingSessionId(attemptId, scheduleId, 'WEBCAM') ?? await pendingSessionId(attemptId, scheduleId, 'SCREEN')
  if (!sessionId) return null
  const session = await changeLiveSession(sessionId, { attemptId, scheduleId }, 'TOUCH')
  return session?.status === 'REQUESTED' ? publicSession(session) : null
}

export async function getTeacherLiveSession(sessionId: string, teacherId: string) {
  const session = await changeLiveSession(sessionId, { teacherId }, 'TOUCH')
  return session ? publicSession(session) : null
}

export async function getStudentLiveSession(sessionId: string, attemptId: string, scheduleId: string) {
  const session = await changeLiveSession(sessionId, { attemptId, scheduleId }, 'TOUCH')
  return session ? publicSession(session) : null
}

export async function submitStudentOffer(input: { sessionId: string; attemptId: string; scheduleId: string; offer: JsonSignal }) {
  const session = await changeLiveSession(input.sessionId, { attemptId: input.attemptId, scheduleId: input.scheduleId }, 'OFFER', input.offer)
  return session ? publicSession(session) : null
}

export async function submitTeacherAnswer(input: { sessionId: string; teacherId: string; answer: JsonSignal }) {
  const session = await changeLiveSession(input.sessionId, { teacherId: input.teacherId }, 'ANSWER', input.answer)
  return session ? publicSession(session) : null
}

export async function addStudentCandidate(input: { sessionId: string; attemptId: string; scheduleId: string; candidate: JsonSignal }) {
  const session = await changeLiveSession(input.sessionId, { attemptId: input.attemptId, scheduleId: input.scheduleId }, 'STUDENT_CANDIDATE', input.candidate)
  return session ? { ok: true } : null
}

export async function addTeacherCandidate(input: { sessionId: string; teacherId: string; candidate: JsonSignal }) {
  const session = await changeLiveSession(input.sessionId, { teacherId: input.teacherId }, 'TEACHER_CANDIDATE', input.candidate)
  return session ? { ok: true } : null
}

export async function getStudentCandidates(sessionId: string, teacherId: string, from = 0) {
  const session = await changeLiveSession(sessionId, { teacherId }, 'TOUCH')
  return session ? { candidates: session.studentCandidates.slice(from), nextCursor: session.studentCandidates.length } : null
}

export async function getTeacherCandidates(sessionId: string, attemptId: string, scheduleId: string, from = 0) {
  const session = await changeLiveSession(sessionId, { attemptId, scheduleId }, 'TOUCH')
  return session ? { candidates: session.teacherCandidates.slice(from), nextCursor: session.teacherCandidates.length } : null
}

export async function endLiveSession(sessionId: string, actor: { teacherId?: string; attemptId?: string; scheduleId?: string }) {
  const identity = actor.teacherId ? { teacherId: actor.teacherId }
    : actor.attemptId && actor.scheduleId ? { attemptId: actor.attemptId, scheduleId: actor.scheduleId } : null
  if (!identity) return null
  const session = await changeLiveSession(sessionId, identity, 'END')
  return session ? publicSession(session) : null
}

export async function endAttemptLiveSessions(attemptId: string, scheduleId: string) {
  const ended = []
  for (const streamType of ['WEBCAM', 'SCREEN'] as const) {
    const sessionId = await pendingSessionId(attemptId, scheduleId, streamType)
    if (!sessionId) continue
    const session = await changeLiveSession(sessionId, { attemptId, scheduleId }, 'END')
    if (session) ended.push(publicSession(session))
  }
  return ended
}
