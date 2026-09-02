import type { Prisma, SeverityLevel, ViolationType } from '@prisma/client'
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
  evidenceUrls: string[]
}

function toEvidenceUrls(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

export async function createViolation(input: CreateViolationInput) {
  const violation = await prisma.violation.create({
    data: {
      attemptId: input.attemptId,
      violationType: input.violationType,
      severity: input.severity,
      description: input.description,
      detectedAt: input.detectedAt,
      evidenceUrls: input.evidenceUrls,
    },
    select: {
      id: true,
      violationType: true,
      severity: true,
      detectedAt: true,
      evidenceUrls: true,
    },
  })

  return {
    ...violation,
    evidenceUrls: toEvidenceUrls(violation.evidenceUrls),
  }
}
