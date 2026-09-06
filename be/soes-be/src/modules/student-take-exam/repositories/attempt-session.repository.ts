import prisma from '../../../lib/prisma'
import type { WebcamStatus } from '@prisma/client'

interface UpsertExamSessionHeartbeatInput {
  webcamStatus?: WebcamStatus
}

export async function upsertExamSessionHeartbeat(
  attemptId: string,
  lastHeartbeat: Date,
  input: UpsertExamSessionHeartbeatInput = {},
) {
  const webcamHeartbeatAt = input.webcamStatus === 'ACTIVE' ? lastHeartbeat : undefined

  await prisma.examSession.upsert({
    where: { attemptId },
    update: {
      lastHeartbeat,
      isOnline: true,
      ...(input.webcamStatus ? { webcamStatus: input.webcamStatus } : {}),
      ...(webcamHeartbeatAt ? { lastWebcamHeartbeatAt: webcamHeartbeatAt } : {}),
    },
    create: {
      attemptId,
      lastHeartbeat,
      isOnline: true,
      ipAddress: 'unknown',
      deviceInfo: 'unknown',
      webcamStatus: input.webcamStatus ?? 'NOT_REQUIRED',
      lastWebcamHeartbeatAt: webcamHeartbeatAt,
    },
  })
}

export async function markStaleExamSessionsOffline(cutoff: Date) {
  const staleSessions = await prisma.examSession.findMany({
    where: {
      isOnline: true,
      lastHeartbeat: { lt: cutoff },
      attempt: { status: 'IN_PROGRESS' },
    },
    select: {
      attemptId: true,
      lastHeartbeat: true,
      attempt: { select: { examScheduleId: true } },
    },
  })

  if (staleSessions.length === 0) return []

  await prisma.examSession.updateMany({
    where: { attemptId: { in: staleSessions.map((session) => session.attemptId) } },
    data: { isOnline: false },
  })

  return staleSessions.map((session) => ({
    attemptId: session.attemptId,
    scheduleId: session.attempt.examScheduleId,
    lastHeartbeatAt: session.lastHeartbeat,
  }))
}

export async function findAttemptForHeartbeat(attemptId: string, scheduleId: string, studentId: string) {
  return prisma.examAttempt.findFirst({
    where: { id: attemptId, examScheduleId: scheduleId, studentId },
    select: {
      id: true,
      status: true,
      deadlineAt: true,
      examSchedule: { select: { enableWebcam: true } },
      examSession: { select: { lastHeartbeat: true } },
    },
  })
}
