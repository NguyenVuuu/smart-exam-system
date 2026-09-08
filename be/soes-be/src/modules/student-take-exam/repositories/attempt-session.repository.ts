import prisma from '../../../lib/prisma'
import type { ScreenShareStatus, WebcamStatus } from '@prisma/client'

interface UpsertExamSessionHeartbeatInput {
  webcamStatus?: WebcamStatus
  screenShareStatus?: ScreenShareStatus
}

export async function upsertExamSessionHeartbeat(
  attemptId: string,
  lastHeartbeat: Date,
  input: UpsertExamSessionHeartbeatInput = {},
) {
  const webcamHeartbeatAt = input.webcamStatus === 'ACTIVE' ? lastHeartbeat : undefined
  const screenHeartbeatAt = input.screenShareStatus === 'ACTIVE' ? lastHeartbeat : undefined

  await prisma.examSession.upsert({
    where: { attemptId },
    update: {
      lastHeartbeat,
      isOnline: true,
      ...(input.webcamStatus ? { webcamStatus: input.webcamStatus } : {}),
      ...(webcamHeartbeatAt ? { lastWebcamHeartbeatAt: webcamHeartbeatAt } : {}),
      ...(input.screenShareStatus ? { screenShareStatus: input.screenShareStatus } : {}),
      ...(screenHeartbeatAt ? { lastScreenHeartbeatAt: screenHeartbeatAt } : {}),
    },
    create: {
      attemptId,
      lastHeartbeat,
      isOnline: true,
      ipAddress: 'unknown',
      deviceInfo: 'unknown',
      webcamStatus: input.webcamStatus ?? 'NOT_REQUIRED',
      lastWebcamHeartbeatAt: webcamHeartbeatAt,
      screenShareStatus: input.screenShareStatus ?? 'NOT_REQUIRED',
      lastScreenHeartbeatAt: screenHeartbeatAt,
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
      examSchedule: { select: { enableWebcam: true, enableScreenMonitoring: true } },
      examSession: { select: { lastHeartbeat: true } },
    },
  })
}
