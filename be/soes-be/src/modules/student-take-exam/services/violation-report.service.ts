import { randomUUID } from 'node:crypto'
import type { Prisma, ViolationType, ViolationSource, ViolationEvidenceType } from '@prisma/client'
import { ConflictError, NotFoundError, TooManyRequestsError, ValidationError } from '../../../errors/AppError'
import { minioConfig } from '../../../config'
import { logger } from '../../../lib/logger'
import redis from '../../../lib/redis'
import { saveViolationEvidenceFilesLocal, uploadViolationEvidenceFiles } from '../../../lib/minio'
import * as repo from '../repositories/attempt-violation.repository'
import type { RecordViolationResult } from '../types'
import { phoneEvidenceId } from './phone-evidence-id'
import { studentViolationSeverity } from './violation.policy'
import { emitViolationCreatedFromAttempt, emitViolationEnded } from './violation-events'

export async function recordViolation(
  scheduleId: string,
  attemptId: string,
  studentId: string,
  input: {
    violationType: string
    description?: string
    metadata?: Prisma.InputJsonObject
  },
  evidenceFiles: Express.Multer.File[] = [],
): Promise<RecordViolationResult> {
  const attempt = await repo.findAttemptForViolation(attemptId, scheduleId, studentId)
  if (!attempt) {
    throw new NotFoundError('Attempt not found')
  }

  const phoneMetadata = input.violationType === 'PHONE_DETECTED' && evidenceFiles.length === 1 ? input.metadata : undefined
  const isPhoneEvidence = Boolean(phoneMetadata)
  const violationId = phoneMetadata ? phoneEvidenceId(attemptId, phoneMetadata, evidenceFiles[0].buffer) : randomUUID()
  if (isPhoneEvidence) {
    const recorded = await repo.findRecordedViolation(violationId, attemptId)
    if (recorded) return recorded
  }
  const now = new Date()
  if (attempt.status !== 'IN_PROGRESS' || now >= attempt.deadlineAt) {
    throw new ConflictError('Exam attempt has ended')
  }
  const severity = studentViolationSeverity(input.violationType as ViolationType, attempt.examSchedule)
  if (input.violationType === 'PHONE_DETECTED' && evidenceFiles.length !== 1) {
    throw new ValidationError('Phone detection requires one evidence image')
  }
  // Camera status reports may arrive after the browser has frozen on its last
  // frame. An image from that frame is not evidence of the blocked interval.
  const evidenceFilesToStore = ['CAMERA_BLOCKED', 'CAMERA_DISCONNECTED', 'CAMERA_PERMISSION_DENIED'].includes(input.violationType)
    ? []
    : evidenceFiles
  const rateKey = `proctoring:violations:${attemptId}`
  const count = await redis.incr(rateKey)
  if (count === 1) await redis.expire(rateKey, 60)
  if (count > 30) throw new TooManyRequestsError('Too many violation reports; retry shortly')

  const detectedAt = now

  const source = getViolationSource(input.violationType as ViolationType)
  const evidenceType = getViolationEvidenceType(input.violationType as ViolationType)
  const storagePrefix = attempt.examSchedule.proctoringStoragePath ?? (isPhoneEvidence ? `violations/${scheduleId}` : undefined)
  let evidenceObjectNames: string[] = []
  let evidenceStorageProvider: 'MINIO' | 'LOCAL' = 'MINIO'
  try {
    evidenceObjectNames = await uploadViolationEvidenceFiles({
      attemptId,
      violationType: input.violationType,
      detectedAt,
      files: evidenceFilesToStore,
      storagePrefix,
      violationId,
    })
  } catch (error) {
    logger.error('Failed to upload violation evidence', {
      attemptId,
      violationType: input.violationType,
      error: error instanceof Error ? error.message : String(error),
    })
    if (minioConfig.requireEvidenceStorage) {
      throw new ValidationError('Evidence storage is not available')
    }
    evidenceStorageProvider = 'LOCAL'
    evidenceObjectNames = await saveViolationEvidenceFilesLocal({
      attemptId,
      violationType: input.violationType,
      detectedAt,
      files: evidenceFilesToStore,
      storagePrefix,
      violationId,
    })
  }

  const evidences = evidenceObjectNames.map((objectName, index) => {
      const file = evidenceFilesToStore[index]
      return {
        evidenceType,
        bucket: minioConfig.evidenceBucket,
        objectName,
        storagePath: objectName.split('/').slice(0, -1).join('/'),
        fileName: file?.originalname ?? objectName.split('/').pop() ?? 'evidence.jpg',
        contentType: file?.mimetype ?? 'image/jpeg',
        fileSize: file?.size,
        storageProvider: evidenceStorageProvider,
      }
    })

  let violation: Awaited<ReturnType<typeof repo.createViolation>>
  try {
    violation = await repo.createViolation({
      id: violationId,
      attemptId,
      violationType: input.violationType as ViolationType,
      source,
      severity,
      description: input.description,
      metadata: input.metadata,
      detectedAt,
      evidences,
    })
  } catch (error) {
    if (isPhoneEvidence && error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      const recorded = await repo.findRecordedViolation(violationId, attemptId)
      if (recorded) return recorded
    }
    throw error
  }
  await emitViolationCreatedFromAttempt(
    scheduleId,
    attemptId,
    attempt,
    {
      ...violation,
      metadata: input.metadata,
      evidences: violation.evidenceUrls.map((objectName, index) => ({
        id: violation.evidenceIds[index],
        objectName,
        storageProvider: evidenceStorageProvider,
      })),
    },
    input.description ?? null,
  )
  return violation
}

export async function endViolation(
  scheduleId: string,
  attemptId: string,
  studentId: string,
  violationId: string,
): Promise<RecordViolationResult> {
  const endedAt = new Date()

  const violation = await repo.endViolation({
    scheduleId,
    attemptId,
    studentId,
    violationId,
    endedAt,
  })

  if (!violation) {
    throw new NotFoundError('Violation not found')
  }

  emitViolationEnded(scheduleId, violation)
  return violation
}

function getViolationSource(violationType: ViolationType): ViolationSource {
  if (
    [
      'NO_FACE',
      'MULTIPLE_FACES',
      'LOOKING_AWAY',
      'PHONE_DETECTED',
      'CAMERA_BLOCKED',
      'CAMERA_DISCONNECTED',
      'CAMERA_PERMISSION_DENIED',
    ].includes(violationType)
  ) {
    return 'WEBCAM'
  }

  if (['SCREEN_SHARE_STOPPED', 'SCREEN_PERMISSION_DENIED'].includes(violationType)) {
    return 'SCREEN'
  }

  if (['PROCTOR_WEBCAM_CAPTURE', 'PROCTOR_SCREEN_CAPTURE'].includes(violationType)) {
    return 'PROCTOR'
  }

  return 'BROWSER'
}

function getViolationEvidenceType(violationType: ViolationType): ViolationEvidenceType {
  return getViolationSource(violationType) === 'WEBCAM' || violationType === 'PROCTOR_WEBCAM_CAPTURE'
    ? 'WEBCAM_IMAGE'
    : 'SCREEN_IMAGE'
}
