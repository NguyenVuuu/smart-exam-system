import type { SeverityLevel, ViolationEvidenceType, ViolationSource, ViolationType, WebcamStatus } from '@prisma/client'
import prisma from '../../../lib/prisma'

const cameraStatusViolationTypes = [
  'CAMERA_DISCONNECTED',
  'CAMERA_PERMISSION_DENIED',
  'CAMERA_BLOCKED',
] satisfies ViolationType[]

export function findAttemptForViolation(
  attemptId: string,
  scheduleId: string,
  studentId: string,
) {
  return prisma.examAttempt.findFirst({
    where: { id: attemptId, examScheduleId: scheduleId, studentId },
    select: {
      id: true,
      status: true,
      deadlineAt: true,
      examSchedule: { select: { proctoringStoragePath: true } },
    },
  })
}

interface CreateViolationInput {
  attemptId: string
  violationType: ViolationType
  source: ViolationSource
  severity: SeverityLevel
  description?: string
  detectedAt: Date
  evidences: Array<{
    evidenceType: ViolationEvidenceType
    bucket: string
    objectName: string
    storagePath: string
    fileName: string
    contentType: string
    fileSize?: number
    storageProvider?: 'MINIO' | 'LOCAL'
  }>
}

interface AddViolationEvidenceInput {
  violationId: string
  evidences: CreateViolationInput['evidences']
}

function getCameraViolationType(webcamStatus: WebcamStatus): ViolationType | null {
  if (webcamStatus === 'DISCONNECTED') return 'CAMERA_DISCONNECTED'
  if (webcamStatus === 'PERMISSION_DENIED') return 'CAMERA_PERMISSION_DENIED'
  if (webcamStatus === 'BLOCKED') return 'CAMERA_BLOCKED'
  return null
}

function getCameraViolationSeverity(violationType: ViolationType): SeverityLevel {
  if (violationType === 'CAMERA_DISCONNECTED') return 'MEDIUM'
  return 'HIGH'
}

function getCameraViolationDescription(violationType: ViolationType): string {
  if (violationType === 'CAMERA_PERMISSION_DENIED') {
    return 'Student denied or revoked webcam permission during the exam.'
  }
  if (violationType === 'CAMERA_BLOCKED') {
    return 'Student webcam stream is blocked, muted, or not producing new frames.'
  }
  return 'Student webcam was disconnected or turned off during the exam.'
}

function durationSecondsBetween(startAt: Date, endAt: Date): number {
  return Math.max(0, Math.round((endAt.getTime() - startAt.getTime()) / 1000))
}

export async function syncCameraStatusViolation(attemptId: string, webcamStatus: WebcamStatus, observedAt: Date) {
  const nextViolationType = getCameraViolationType(webcamStatus)

  await prisma.$transaction(async (tx) => {
    const openViolation = await tx.violation.findFirst({
      where: {
        attemptId,
        source: 'WEBCAM',
        violationType: { in: cameraStatusViolationTypes },
        endedAt: null,
      },
      orderBy: { detectedAt: 'desc' },
      select: { id: true, violationType: true, detectedAt: true },
    })

    if (!nextViolationType) {
      if (!openViolation) return
      await tx.violation.update({
        where: { id: openViolation.id },
        data: {
          endedAt: observedAt,
          durationSeconds: durationSecondsBetween(openViolation.detectedAt, observedAt),
        },
      })
      return
    }

    if (openViolation?.violationType === nextViolationType) return

    if (openViolation) {
      await tx.violation.update({
        where: { id: openViolation.id },
        data: {
          endedAt: observedAt,
          durationSeconds: durationSecondsBetween(openViolation.detectedAt, observedAt),
        },
      })
    }

    await tx.violation.create({
      data: {
        attemptId,
        violationType: nextViolationType,
        source: 'WEBCAM',
        severity: getCameraViolationSeverity(nextViolationType),
        detectedAt: observedAt,
        description: getCameraViolationDescription(nextViolationType),
      },
    })
  })
}

export async function createViolation(input: CreateViolationInput) {
  const existing = await prisma.violation.findFirst({
    where: {
      attemptId: input.attemptId,
      violationType: input.violationType,
      source: input.source,
      endedAt: null,
    },
    orderBy: { detectedAt: 'desc' },
    select: {
      id: true,
      violationType: true,
      severity: true,
      detectedAt: true,
      endedAt: true,
      durationSeconds: true,
      evidences: {
        select: {
          objectName: true,
          storageProvider: true,
        },
      },
    },
  })

  const violation = existing ?? await prisma.violation.create({
    data: {
      attemptId: input.attemptId,
      violationType: input.violationType,
      source: input.source,
      severity: input.severity,
      description: input.description,
      detectedAt: input.detectedAt,
      evidences: {
        create: input.evidences.map((evidence) => ({
          evidenceType: evidence.evidenceType,
          storageProvider: evidence.storageProvider ?? 'MINIO',
          bucket: evidence.bucket,
          objectName: evidence.objectName,
          storagePath: evidence.storagePath,
          fileName: evidence.fileName,
          contentType: evidence.contentType,
          fileSize: evidence.fileSize,
        })),
      },
    },
    select: {
      id: true,
      violationType: true,
      severity: true,
      detectedAt: true,
      endedAt: true,
      durationSeconds: true,
      evidences: {
        select: {
          objectName: true,
          storageProvider: true,
        },
      },
    },
  })

  return {
    id: violation.id,
    violationType: violation.violationType,
    severity: violation.severity,
    detectedAt: violation.detectedAt,
    endedAt: violation.endedAt,
    durationSeconds: violation.durationSeconds,
    evidenceUrls: violation.evidences.map((evidence) => evidence.objectName),
  }
}

export async function addViolationEvidence(input: AddViolationEvidenceInput) {
  if (input.evidences.length === 0) return

  await prisma.violationEvidence.createMany({
    data: input.evidences.map((evidence) => ({
      violationId: input.violationId,
      evidenceType: evidence.evidenceType,
      storageProvider: evidence.storageProvider ?? 'MINIO',
      bucket: evidence.bucket,
      objectName: evidence.objectName,
      storagePath: evidence.storagePath,
      fileName: evidence.fileName,
      contentType: evidence.contentType,
      fileSize: evidence.fileSize,
    })),
  })
}

export async function endViolation(input: {
  attemptId: string
  scheduleId: string
  studentId: string
  violationId: string
  endedAt: Date
}) {
  return prisma.$transaction(async (tx) => {
    const violation = await tx.violation.findFirst({
      where: {
        id: input.violationId,
        attemptId: input.attemptId,
        endedAt: null,
        attempt: {
          examScheduleId: input.scheduleId,
          studentId: input.studentId,
          status: 'IN_PROGRESS',
        },
      },
      select: { id: true, detectedAt: true },
    })

    if (!violation) return null

    const updated = await tx.violation.update({
      where: { id: violation.id },
      data: {
        endedAt: input.endedAt,
        durationSeconds: durationSecondsBetween(violation.detectedAt, input.endedAt),
      },
      select: {
        id: true,
        violationType: true,
        severity: true,
        detectedAt: true,
        endedAt: true,
        durationSeconds: true,
        evidences: { select: { objectName: true } },
      },
    })

    return {
      id: updated.id,
      violationType: updated.violationType,
      severity: updated.severity,
      detectedAt: updated.detectedAt,
      endedAt: updated.endedAt,
      durationSeconds: updated.durationSeconds,
      evidenceUrls: updated.evidences.map((evidence) => evidence.objectName),
    }
  })
}
