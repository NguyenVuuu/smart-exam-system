import type { Prisma } from '@prisma/client'
import { getLocalViolationEvidenceUrl, getViolationEvidenceUrl } from '../../../lib/minio'
import { emitProctoringEvent } from '../../proctoring/proctoring-realtime.events'

function firstEvidenceUrl(scheduleId: string, violationId: string, evidences: Array<{ id?: string; objectName: string; storageProvider?: string }>) {
  const firstEvidence = evidences[0]
  if (!firstEvidence) return Promise.resolve(null)
  if (firstEvidence.id) return Promise.resolve(`/api/teacher/proctoring/schedules/${scheduleId}/violations/${violationId}/evidence/${firstEvidence.id}`)
  return firstEvidence.storageProvider === 'LOCAL'
    ? Promise.resolve(getLocalViolationEvidenceUrl(firstEvidence.objectName))
    : getViolationEvidenceUrl(firstEvidence.objectName)
}

export async function emitViolationCreatedFromAttempt(
  scheduleId: string,
  attemptId: string,
  attempt: {
    studentId: string
    student: { studentCode: string; user: { fullName: string } }
  },
  violation: {
    id: string
    violationType: string
    severity: string
    detectedAt: Date
    endedAt?: Date | null
    durationSeconds?: number | null
    evidences?: Array<{ id?: string; objectName: string; storageProvider?: string }>
    metadata?: Prisma.InputJsonObject
  },
  note?: string | null,
) {
  const evidenceImageUrl = await firstEvidenceUrl(scheduleId, violation.id, violation.evidences ?? []).catch(() => null)
  emitProctoringEvent(scheduleId, 'violation:created', {
    id: violation.id,
    scheduleId,
    attemptId,
    studentId: attempt.studentId,
    studentCode: attempt.student.studentCode,
    studentName: attempt.student.user.fullName,
    type: violation.violationType,
    timestamp: violation.detectedAt.toISOString(),
    severity: violation.severity,
    endedAt: violation.endedAt ? violation.endedAt.toISOString() : null,
    durationSeconds: violation.durationSeconds,
    evidenceImageUrl,
    metadata: violation.metadata ?? null,
    reviewStatus: 'PENDING',
    note: note ?? null,
  })
}

export function emitViolationEnded(scheduleId: string, violation: {
  id: string
  violationType: string
  severity: string
  detectedAt: Date
  endedAt?: Date | null
  durationSeconds?: number | null
  evidenceUrls?: string[]
}) {
  emitProctoringEvent(scheduleId, 'violation:ended', {
    id: violation.id,
    violationType: violation.violationType,
    severity: violation.severity,
    detectedAt: violation.detectedAt,
    endedAt: violation.endedAt,
    durationSeconds: violation.durationSeconds,
    evidenceUrls: violation.evidenceUrls ?? [],
  })
}
