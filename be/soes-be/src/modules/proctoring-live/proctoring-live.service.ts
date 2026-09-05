import { randomUUID } from 'crypto'

const REQUEST_TTL_MS = 30_000
const SESSION_TTL_MS = 10 * 60_000

type JsonSignal = Record<string, unknown>

interface LiveSession {
  id: string
  attemptId: string
  scheduleId: string
  teacherId: string
  createdAt: number
  updatedAt: number
  status: 'REQUESTED' | 'OFFERED' | 'CONNECTED' | 'ENDED'
  offer: JsonSignal | null
  answer: JsonSignal | null
  studentCandidates: JsonSignal[]
  teacherCandidates: JsonSignal[]
}

const sessions = new Map<string, LiveSession>()

function cleanup(now = Date.now()) {
  for (const [id, session] of sessions.entries()) {
    const ttl = session.status === 'REQUESTED' ? REQUEST_TTL_MS : SESSION_TTL_MS
    if (session.status === 'ENDED' || now - session.updatedAt > ttl) {
      sessions.delete(id)
    }
  }
}

function publicSession(session: LiveSession) {
  return {
    id: session.id,
    attemptId: session.attemptId,
    scheduleId: session.scheduleId,
    status: session.status,
    offer: session.offer,
    answer: session.answer,
    studentCandidateCount: session.studentCandidates.length,
    teacherCandidateCount: session.teacherCandidates.length,
    updatedAt: new Date(session.updatedAt).toISOString(),
  }
}

export function requestLiveCamera(input: { attemptId: string; scheduleId: string; teacherId: string }) {
  cleanup()
  const existing = [...sessions.values()].find((session) =>
    session.attemptId === input.attemptId &&
    session.teacherId === input.teacherId &&
    session.status !== 'ENDED'
  )

  if (existing) {
    existing.updatedAt = Date.now()
    return publicSession(existing)
  }

  const now = Date.now()
  const session: LiveSession = {
    id: randomUUID(),
    attemptId: input.attemptId,
    scheduleId: input.scheduleId,
    teacherId: input.teacherId,
    createdAt: now,
    updatedAt: now,
    status: 'REQUESTED',
    offer: null,
    answer: null,
    studentCandidates: [],
    teacherCandidates: [],
  }
  sessions.set(session.id, session)
  return publicSession(session)
}

export function getPendingStudentRequest(attemptId: string, scheduleId: string) {
  cleanup()
  const session = [...sessions.values()].find((item) =>
    item.attemptId === attemptId &&
    item.scheduleId === scheduleId &&
    item.status === 'REQUESTED'
  )
  return session ? publicSession(session) : null
}

export function getTeacherLiveSession(sessionId: string, teacherId: string) {
  cleanup()
  const session = sessions.get(sessionId)
  if (!session || session.teacherId !== teacherId) return null
  session.updatedAt = Date.now()
  return publicSession(session)
}

export function getStudentLiveSession(sessionId: string, attemptId: string, scheduleId: string) {
  cleanup()
  const session = sessions.get(sessionId)
  if (!session || session.attemptId !== attemptId || session.scheduleId !== scheduleId) return null
  session.updatedAt = Date.now()
  return publicSession(session)
}

export function submitStudentOffer(input: { sessionId: string; attemptId: string; scheduleId: string; offer: JsonSignal }) {
  const session = sessions.get(input.sessionId)
  if (!session || session.attemptId !== input.attemptId || session.scheduleId !== input.scheduleId) return null
  session.offer = input.offer
  session.status = 'OFFERED'
  session.updatedAt = Date.now()
  return publicSession(session)
}

export function submitTeacherAnswer(input: { sessionId: string; teacherId: string; answer: JsonSignal }) {
  const session = sessions.get(input.sessionId)
  if (!session || session.teacherId !== input.teacherId) return null
  session.answer = input.answer
  session.status = 'CONNECTED'
  session.updatedAt = Date.now()
  return publicSession(session)
}

export function addStudentCandidate(input: { sessionId: string; attemptId: string; scheduleId: string; candidate: JsonSignal }) {
  const session = sessions.get(input.sessionId)
  if (!session || session.attemptId !== input.attemptId || session.scheduleId !== input.scheduleId) return null
  session.studentCandidates.push(input.candidate)
  session.updatedAt = Date.now()
  return { ok: true }
}

export function addTeacherCandidate(input: { sessionId: string; teacherId: string; candidate: JsonSignal }) {
  const session = sessions.get(input.sessionId)
  if (!session || session.teacherId !== input.teacherId) return null
  session.teacherCandidates.push(input.candidate)
  session.updatedAt = Date.now()
  return { ok: true }
}

export function getStudentCandidates(sessionId: string, teacherId: string, from = 0) {
  const session = sessions.get(sessionId)
  if (!session || session.teacherId !== teacherId) return null
  session.updatedAt = Date.now()
  return {
    candidates: session.studentCandidates.slice(from),
    nextCursor: session.studentCandidates.length,
  }
}

export function getTeacherCandidates(sessionId: string, attemptId: string, scheduleId: string, from = 0) {
  const session = sessions.get(sessionId)
  if (!session || session.attemptId !== attemptId || session.scheduleId !== scheduleId) return null
  session.updatedAt = Date.now()
  return {
    candidates: session.teacherCandidates.slice(from),
    nextCursor: session.teacherCandidates.length,
  }
}

export function endLiveSession(sessionId: string, actor: { teacherId?: string; attemptId?: string; scheduleId?: string }) {
  const session = sessions.get(sessionId)
  if (!session) return null
  const allowedTeacher = actor.teacherId && session.teacherId === actor.teacherId
  const allowedStudent = actor.attemptId && actor.scheduleId && session.attemptId === actor.attemptId && session.scheduleId === actor.scheduleId
  if (!allowedTeacher && !allowedStudent) return null
  session.status = 'ENDED'
  session.updatedAt = Date.now()
  return publicSession(session)
}
