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
  return prisma.examSession.updateMany({
    where: {
      isOnline: true,
      lastHeartbeat: { lt: cutoff },
      attempt: { status: 'IN_PROGRESS' },
    },
    data: { isOnline: false },
  })
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
