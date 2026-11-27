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
  return prisma.$queryRaw<Array<{ attemptId: string; scheduleId: string; lastHeartbeatAt: Date }>>`
    WITH stale AS (
      SELECT session."id"
      FROM "ExamSession" AS session
      JOIN "ExamAttempt" AS attempt ON attempt."id" = session."attemptId"
      WHERE session."isOnline" = true AND session."lastHeartbeat" < ${cutoff}
        AND attempt."status" = 'IN_PROGRESS'
      ORDER BY session."lastHeartbeat", session."id"
      LIMIT 200
      FOR UPDATE OF session SKIP LOCKED
    )
    UPDATE "ExamSession" AS session
    SET "isOnline" = false,
        "webcamStatus" = CASE WHEN session."webcamStatus" = 'NOT_REQUIRED'
          THEN 'NOT_REQUIRED'::"WebcamStatus" ELSE 'DISCONNECTED'::"WebcamStatus" END,
        "screenShareStatus" = CASE WHEN session."screenShareStatus" = 'NOT_REQUIRED'
          THEN 'NOT_REQUIRED'::"ScreenShareStatus" ELSE 'STOPPED'::"ScreenShareStatus" END
    FROM stale, "ExamAttempt" AS attempt
    WHERE session."id" = stale."id" AND attempt."id" = session."attemptId"
      AND attempt."status" = 'IN_PROGRESS'
    RETURNING session."attemptId", attempt."examScheduleId" AS "scheduleId",
              session."lastHeartbeat" AS "lastHeartbeatAt"
  `
}

export async function findAttemptForHeartbeat(attemptId: string, scheduleId: string, studentId: string) {
  return prisma.examAttempt.findFirst({
    where: { id: attemptId, examScheduleId: scheduleId, studentId },
    select: {
      id: true,
      studentId: true,
      status: true,
      deadlineAt: true,
      examSchedule: { select: { enableWebcam: true, enableScreenMonitoring: true } },
      examSession: { select: { lastHeartbeat: true } },
      student: {
        select: {
          studentCode: true,
          user: { select: { fullName: true } },
        },
      },
    },
  })
}
