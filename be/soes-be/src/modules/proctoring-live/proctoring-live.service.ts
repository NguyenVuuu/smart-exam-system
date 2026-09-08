import { randomUUID } from 'crypto'
import redis from '../../lib/redis'

const REQUEST_TTL_SECONDS = 30
const SESSION_TTL_SECONDS = 10 * 60
const SESSION_PREFIX = 'proctoring:live:session:'
const ATTEMPT_PREFIX = 'proctoring:live:attempt:'

type JsonSignal = Record<string, unknown>
export type LiveStreamType = 'WEBCAM' | 'SCREEN'

interface LiveSession {
  id: string
  attemptId: string
  scheduleId: string
  teacherId: string
  streamType: LiveStreamType
  createdAt: number
  updatedAt: number
  status: 'REQUESTED' | 'OFFERED' | 'CONNECTED' | 'ENDED'
  offer: JsonSignal | null
  answer: JsonSignal | null
  studentCandidates: JsonSignal[]
  teacherCandidates: JsonSignal[]
}

const sessionKey = (id: string) => `${SESSION_PREFIX}${id}`
const attemptKey = (attemptId: string, scheduleId: string, streamType: LiveStreamType) => `${ATTEMPT_PREFIX}${scheduleId}:${attemptId}:${streamType}`

function ttlFor(session: LiveSession) {
  return session.status === 'REQUESTED' ? REQUEST_TTL_SECONDS : SESSION_TTL_SECONDS
}

function publicSession(session: LiveSession) {
  return {
    id: session.id,
    attemptId: session.attemptId,
    scheduleId: session.scheduleId,
    teacherId: session.teacherId,
    streamType: session.streamType,
    status: session.status,
    offer: session.offer,
    answer: session.answer,
    studentCandidateCount: session.studentCandidates.length,
    teacherCandidateCount: session.teacherCandidates.length,
    updatedAt: new Date(session.updatedAt).toISOString(),
  }
}

async function readSession(sessionId: string): Promise<LiveSession | null> {
  const raw = await redis.get(sessionKey(sessionId))
  return raw ? JSON.parse(raw) as LiveSession : null
}

async function writeSession(session: LiveSession) {
  session.updatedAt = Date.now()
  await redis.set(sessionKey(session.id), JSON.stringify(session), 'EX', ttlFor(session))
  if (session.status !== 'ENDED') {
    await redis.set(attemptKey(session.attemptId, session.scheduleId, session.streamType), session.id, 'EX', ttlFor(session))
  }
}

async function endSession(session: LiveSession) {
  session.status = 'ENDED'
  session.updatedAt = Date.now()
  await redis.set(sessionKey(session.id), JSON.stringify(session), 'EX', 10)
  await redis.del(attemptKey(session.attemptId, session.scheduleId, session.streamType))
}

export async function requestLiveStream(input: { attemptId: string; scheduleId: string; teacherId: string; streamType: LiveStreamType }) {
  const existingId = await redis.get(attemptKey(input.attemptId, input.scheduleId, input.streamType))
  if (existingId) {
    const existing = await readSession(existingId)
    if (existing && existing.teacherId === input.teacherId && existing.status !== 'ENDED') {
      await writeSession(existing)
      return publicSession(existing)
    }
  }

  const now = Date.now()
  const session: LiveSession = {
    id: randomUUID(),
    attemptId: input.attemptId,
    scheduleId: input.scheduleId,
    teacherId: input.teacherId,
    streamType: input.streamType,
    createdAt: now,
    updatedAt: now,
    status: 'REQUESTED',
    offer: null,
    answer: null,
    studentCandidates: [],
    teacherCandidates: [],
  }
  await writeSession(session)
  return publicSession(session)
}

export const requestLiveCamera = (input: { attemptId: string; scheduleId: string; teacherId: string }) =>
  requestLiveStream({ ...input, streamType: 'WEBCAM' })

export async function getPendingStudentRequest(attemptId: string, scheduleId: string, streamType?: LiveStreamType) {
  const sessionId = streamType
    ? await redis.get(attemptKey(attemptId, scheduleId, streamType))
    : (await redis.get(attemptKey(attemptId, scheduleId, 'WEBCAM'))) ?? (await redis.get(attemptKey(attemptId, scheduleId, 'SCREEN')))
  if (!sessionId) return null
  const session = await readSession(sessionId)
  if (!session || session.status !== 'REQUESTED') return null
  await writeSession(session)
  return publicSession(session)
}

export async function getTeacherLiveSession(sessionId: string, teacherId: string) {
  const session = await readSession(sessionId)
  if (!session || session.teacherId !== teacherId) return null
  await writeSession(session)
  return publicSession(session)
}

export async function getStudentLiveSession(sessionId: string, attemptId: string, scheduleId: string) {
  const session = await readSession(sessionId)
  if (!session || session.attemptId !== attemptId || session.scheduleId !== scheduleId) return null
  await writeSession(session)
  return publicSession(session)
}

export async function submitStudentOffer(input: { sessionId: string; attemptId: string; scheduleId: string; offer: JsonSignal }) {
  const session = await readSession(input.sessionId)
  if (!session || session.attemptId !== input.attemptId || session.scheduleId !== input.scheduleId) return null
  session.offer = input.offer
  session.status = 'OFFERED'
  await writeSession(session)
  return publicSession(session)
}

export async function submitTeacherAnswer(input: { sessionId: string; teacherId: string; answer: JsonSignal }) {
  const session = await readSession(input.sessionId)
  if (!session || session.teacherId !== input.teacherId) return null
  session.answer = input.answer
  session.status = 'CONNECTED'
  await writeSession(session)
  return publicSession(session)
}

export async function addStudentCandidate(input: { sessionId: string; attemptId: string; scheduleId: string; candidate: JsonSignal }) {
  const session = await readSession(input.sessionId)
  if (!session || session.attemptId !== input.attemptId || session.scheduleId !== input.scheduleId) return null
  session.studentCandidates.push(input.candidate)
  await writeSession(session)
  return { ok: true }
}

export async function addTeacherCandidate(input: { sessionId: string; teacherId: string; candidate: JsonSignal }) {
  const session = await readSession(input.sessionId)
  if (!session || session.teacherId !== input.teacherId) return null
  session.teacherCandidates.push(input.candidate)
  await writeSession(session)
  return { ok: true }
}

export async function getStudentCandidates(sessionId: string, teacherId: string, from = 0) {
  const session = await readSession(sessionId)
  if (!session || session.teacherId !== teacherId) return null
  await writeSession(session)
  return {
    candidates: session.studentCandidates.slice(from),
    nextCursor: session.studentCandidates.length,
  }
}

export async function getTeacherCandidates(sessionId: string, attemptId: string, scheduleId: string, from = 0) {
  const session = await readSession(sessionId)
  if (!session || session.attemptId !== attemptId || session.scheduleId !== scheduleId) return null
  await writeSession(session)
  return {
    candidates: session.teacherCandidates.slice(from),
    nextCursor: session.teacherCandidates.length,
  }
}

export async function endLiveSession(sessionId: string, actor: { teacherId?: string; attemptId?: string; scheduleId?: string }) {
  const session = await readSession(sessionId)
  if (!session) return null
  const allowedTeacher = actor.teacherId && session.teacherId === actor.teacherId
  const allowedStudent = actor.attemptId && actor.scheduleId && session.attemptId === actor.attemptId && session.scheduleId === actor.scheduleId
  if (!allowedTeacher && !allowedStudent) return null
  await endSession(session)
  return publicSession(session)
}
