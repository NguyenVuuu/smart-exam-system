import prisma from '../../../lib/prisma'

export async function upsertExamSessionHeartbeat(attemptId: string, lastHeartbeat: Date) {
  await prisma.examSession.upsert({
    where: { attemptId },
    update: { lastHeartbeat, isOnline: true },
    create: {
      attemptId,
      lastHeartbeat,
      isOnline: true,
      ipAddress: 'unknown',
      deviceInfo: 'unknown',
    },
  })
}

export async function findAttemptForHeartbeat(attemptId: string, scheduleId: string, studentId: string) {
  return prisma.examAttempt.findFirst({
    where: { id: attemptId, examScheduleId: scheduleId, studentId },
    select: {
      id: true,
      status: true,
      deadlineAt: true,
      examSession: { select: { lastHeartbeat: true } },
    },
  })
}
