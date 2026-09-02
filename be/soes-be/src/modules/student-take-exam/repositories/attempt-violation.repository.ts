import type { SeverityLevel, ViolationType } from '@prisma/client'
import prisma from '../../../lib/prisma'

export function findAttemptForViolation(
  attemptId: string,
  scheduleId: string,
  studentId: string,
) {
  return prisma.examAttempt.findFirst({
    where: { id: attemptId, examScheduleId: scheduleId, studentId },
    select: { id: true, status: true, deadlineAt: true },
  })
}

interface CreateViolationInput {
  attemptId: string
  violationType: ViolationType
  severity: SeverityLevel
  description?: string
  detectedAt: Date
}

export function createViolation(input: CreateViolationInput) {
  return prisma.violation.create({
    data: {
      attemptId: input.attemptId,
      violationType: input.violationType,
      severity: input.severity,
      description: input.description,
      detectedAt: input.detectedAt,
      evidenceUrls: [],
    },
    select: {
      id: true,
      violationType: true,
      severity: true,
      detectedAt: true,
    },
  })
}
