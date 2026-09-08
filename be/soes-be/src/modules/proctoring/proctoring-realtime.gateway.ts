import type { Server as HttpServer } from 'http'
import { Server, type Socket } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import redis from '../../lib/redis'
import { logger } from '../../lib/logger'
import { corsConfig } from '../../config'
import { tokenBlacklist } from '../../lib/redis'
import { verifyAccessToken, type AccountRole } from '../../utils/jwt'
import * as teacherGrading from '../teacher-exams/services/teacher-exam-grading.service'
import * as studentTakeExam from '../student-take-exam/services/student-take-exam.service'
import { setProctoringEmitter } from './proctoring-realtime.events'

type SocketUser = {
  id: string
  profileId: string
  role: AccountRole
}

type CandidatePayload = {
  sessionId: string
  candidate: Record<string, unknown>
}

let io: Server | null = null

const scheduleRoom = (scheduleId: string) => `proctoring:schedule:${scheduleId}`
const attemptRoom = (attemptId: string) => `proctoring:attempt:${attemptId}`
const teacherRoom = (teacherId: string) => `proctoring:teacher:${teacherId}`

function socketUser(socket: Socket): SocketUser {
  return socket.data.user as SocketUser
}

function getToken(socket: Socket) {
  const authToken = socket.handshake.auth?.token
  if (typeof authToken === 'string' && authToken.trim()) return authToken
  const header = socket.handshake.headers.authorization
  if (header?.startsWith('Bearer ')) return header.slice(7)
  return null
}

async function authenticateSocket(socket: Socket, next: (err?: Error) => void) {
  try {
    const token = getToken(socket)
    if (!token) throw new Error('Missing socket token')

    const payload = verifyAccessToken(token)
    if (await tokenBlacklist.isBlacklisted(payload.jti)) {
      throw new Error('Token has been revoked')
    }

    socket.data.user = {
      id: payload.sub,
      profileId: payload.profileId,
      role: payload.role,
    } satisfies SocketUser
    next()
  } catch (error) {
    next(error instanceof Error ? error : new Error('Socket authentication failed'))
  }
}

async function configureRedisAdapter(server: Server) {
  try {
    const pubClient = redis.duplicate()
    const subClient = redis.duplicate()
    await Promise.all([pubClient.connect(), subClient.connect()])
    server.adapter(createAdapter(pubClient, subClient))
    logger.info('Socket.IO Redis adapter connected')
  } catch (error) {
    logger.error('Socket.IO Redis adapter disabled', {
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

export async function initProctoringRealtime(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: corsConfig.allowedOrigins,
      credentials: true,
    },
  })

  await configureRedisAdapter(io)
  io.use(authenticateSocket)
  setProctoringEmitter({
    emitToSchedule: (scheduleId, event, payload) => io?.to(scheduleRoom(scheduleId)).emit(event, payload),
    emitToAttempt: (attemptId, event, payload) => io?.to(attemptRoom(attemptId)).emit(event, payload),
  })

  io.on('connection', (socket) => {
    const user = socketUser(socket)
    if (user.role === 'TEACHER') void socket.join(teacherRoom(user.profileId))

    socket.on('proctoring:join_schedule', async ({ scheduleId }: { scheduleId: string }, ack?: (data: unknown) => void) => {
      try {
        if (user.role !== 'TEACHER') throw new Error('Only teachers can join schedule rooms')
        const data = await teacherGrading.listLiveProctoringSessions(user.profileId, scheduleId)
        await socket.join(scheduleRoom(scheduleId))
        ack?.({ ok: true, data })
      } catch (error) {
        ack?.({ ok: false, error: error instanceof Error ? error.message : 'Unable to join schedule' })
      }
    })

    socket.on('proctoring:join_attempt', async (
      { scheduleId, attemptId }: { scheduleId: string; attemptId: string },
      ack?: (data: unknown) => void,
    ) => {
      try {
        if (user.role !== 'STUDENT') throw new Error('Only students can join attempt rooms')
        await studentTakeExam.requireLiveAttempt(scheduleId, attemptId, user.profileId)
        await socket.join(attemptRoom(attemptId))
        await socket.join(scheduleRoom(scheduleId))
        ack?.({ ok: true })
      } catch (error) {
        ack?.({ ok: false, error: error instanceof Error ? error.message : 'Unable to join attempt' })
      }
    })

    socket.on('live:request_camera', async ({ attemptId }: { attemptId: string }, ack?: (data: unknown) => void) => {
      try {
        if (user.role !== 'TEACHER') throw new Error('Only teachers can request live camera')
        const session = await teacherGrading.requestLiveCamera(user.profileId, attemptId)
        io?.to(attemptRoom(attemptId)).emit('live:request', session)
        ack?.({ ok: true, data: session })
      } catch (error) {
        ack?.({ ok: false, error: error instanceof Error ? error.message : 'Unable to request live camera' })
      }
    })

    socket.on('live:request_screen', async ({ attemptId }: { attemptId: string }, ack?: (data: unknown) => void) => {
      try {
        if (user.role !== 'TEACHER') throw new Error('Only teachers can request live screen')
        const session = await teacherGrading.requestLiveScreen(user.profileId, attemptId)
        io?.to(attemptRoom(attemptId)).emit('live:request', session)
        ack?.({ ok: true, data: session })
      } catch (error) {
        ack?.({ ok: false, error: error instanceof Error ? error.message : 'Unable to request live screen' })
      }
    })

    socket.on('live:student_offer', async (
      { scheduleId, attemptId, sessionId, offer }: { scheduleId: string; attemptId: string; sessionId: string; offer: Record<string, unknown> },
      ack?: (data: unknown) => void,
    ) => {
      try {
        if (user.role !== 'STUDENT') throw new Error('Only students can publish live offers')
        const session = await studentTakeExam.submitLiveCameraOffer(scheduleId, attemptId, user.profileId, sessionId, offer)
        io?.to(teacherRoom(session.teacherId)).emit('live:offer', session)
        ack?.({ ok: true, data: session })
      } catch (error) {
        ack?.({ ok: false, error: error instanceof Error ? error.message : 'Unable to submit live offer' })
      }
    })

    socket.on('live:teacher_answer', async (
      { sessionId, answer }: { sessionId: string; answer: Record<string, unknown> },
      ack?: (data: unknown) => void,
    ) => {
      try {
        if (user.role !== 'TEACHER') throw new Error('Only teachers can answer live offers')
        const session = await teacherGrading.submitTeacherLiveAnswer(user.profileId, sessionId, answer)
        io?.to(attemptRoom(session.attemptId)).emit('live:answer', session)
        ack?.({ ok: true, data: session })
      } catch (error) {
        ack?.({ ok: false, error: error instanceof Error ? error.message : 'Unable to submit live answer' })
      }
    })

    socket.on('live:student_candidate', async (
      { scheduleId, attemptId, sessionId, candidate }: CandidatePayload & { scheduleId: string; attemptId: string },
      ack?: (data: unknown) => void,
    ) => {
      try {
        if (user.role !== 'STUDENT') throw new Error('Only students can publish ICE candidates')
        await studentTakeExam.addStudentLiveCandidate(scheduleId, attemptId, user.profileId, sessionId, candidate)
        const session = await studentTakeExam.getStudentLiveSession(scheduleId, attemptId, user.profileId, sessionId)
        io?.to(teacherRoom(session.teacherId)).emit('live:student_candidate', { sessionId, candidate })
        ack?.({ ok: true })
      } catch (error) {
        ack?.({ ok: false, error: error instanceof Error ? error.message : 'Unable to add ICE candidate' })
      }
    })

    socket.on('live:teacher_candidate', async ({ sessionId, candidate }: CandidatePayload, ack?: (data: unknown) => void) => {
      try {
        if (user.role !== 'TEACHER') throw new Error('Only teachers can publish ICE candidates')
        await teacherGrading.addTeacherLiveCandidate(user.profileId, sessionId, candidate)
        const session = await teacherGrading.getTeacherLiveSession(user.profileId, sessionId)
        io?.to(attemptRoom(session.attemptId)).emit('live:teacher_candidate', { sessionId, candidate })
        ack?.({ ok: true })
      } catch (error) {
        ack?.({ ok: false, error: error instanceof Error ? error.message : 'Unable to add ICE candidate' })
      }
    })

    socket.on('live:end', async ({ sessionId }: { sessionId: string }, ack?: (data: unknown) => void) => {
      try {
        const session = user.role === 'TEACHER'
          ? await teacherGrading.endTeacherLiveSession(user.profileId, sessionId)
          : null
        if (!session) throw new Error('Live session not found')
        io?.to(attemptRoom(session.attemptId)).to(teacherRoom(session.teacherId)).emit('live:ended', session)
        ack?.({ ok: true, data: session })
      } catch (error) {
        ack?.({ ok: false, error: error instanceof Error ? error.message : 'Unable to end live session' })
      }
    })
  })

  logger.info('Socket.IO proctoring gateway started')
  return io
}

export function emitProctoringEvent(scheduleId: string, event: string, payload: unknown) {
  io?.to(scheduleRoom(scheduleId)).emit(event, payload)
}

export function emitAttemptEvent(attemptId: string, event: string, payload: unknown) {
  io?.to(attemptRoom(attemptId)).emit(event, payload)
}
