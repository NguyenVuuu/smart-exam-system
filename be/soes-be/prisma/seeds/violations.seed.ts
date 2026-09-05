import {
  FileStorageProvider,
  PrismaClient,
  SeverityLevel,
  Violation,
  ViolationDetectedBy,
  ViolationEvidenceType,
  ViolationReviewStatus,
  ViolationSource,
  ViolationType,
} from '@prisma/client'

const EVIDENCE_BUCKET = process.env.MINIO_EVIDENCE_BUCKET ?? 'soes-evidence'

type ViolationSeedTemplate = {
  type: ViolationType
  source: ViolationSource
  severity: SeverityLevel
  detectedBy: ViolationDetectedBy
  reviewStatus: ViolationReviewStatus
  durationSeconds?: number
  evidenceType?: ViolationEvidenceType
}

const templates: ViolationSeedTemplate[] = [
  {
    type: 'CAMERA_DISCONNECTED',
    source: 'WEBCAM',
    severity: 'HIGH',
    detectedBy: 'SYSTEM',
    reviewStatus: 'PENDING',
    durationSeconds: 28,
    evidenceType: 'WEBCAM_IMAGE',
  },
  {
    type: 'NO_FACE',
    source: 'WEBCAM',
    severity: 'MEDIUM',
    detectedBy: 'SYSTEM',
    reviewStatus: 'PENDING',
    durationSeconds: 12,
    evidenceType: 'WEBCAM_IMAGE',
  },
  {
    type: 'MULTIPLE_FACES',
    source: 'WEBCAM',
    severity: 'HIGH',
    detectedBy: 'SYSTEM',
    reviewStatus: 'CONFIRMED',
    durationSeconds: 8,
    evidenceType: 'WEBCAM_IMAGE',
  },
  {
    type: 'TAB_SWITCH',
    source: 'BROWSER',
    severity: 'MEDIUM',
    detectedBy: 'SYSTEM',
    reviewStatus: 'PENDING',
    durationSeconds: 5,
    evidenceType: 'SCREEN_IMAGE',
  },
  {
    type: 'SCREEN_SHARE_STOPPED',
    source: 'SCREEN',
    severity: 'HIGH',
    detectedBy: 'SYSTEM',
    reviewStatus: 'PENDING',
    durationSeconds: 17,
    evidenceType: 'SCREEN_IMAGE',
  },
  {
    type: 'PROCTOR_WEBCAM_CAPTURE',
    source: 'PROCTOR',
    severity: 'HIGH',
    detectedBy: 'PROCTOR',
    reviewStatus: 'CONFIRMED',
    evidenceType: 'WEBCAM_IMAGE',
  },
  {
    type: 'PROCTOR_SCREEN_CAPTURE',
    source: 'PROCTOR',
    severity: 'MEDIUM',
    detectedBy: 'PROCTOR',
    reviewStatus: 'PENDING',
    evidenceType: 'SCREEN_IMAGE',
  },
]

function evidenceFolder(type: ViolationEvidenceType): 'webcam' | 'screen' {
  return type === 'WEBCAM_IMAGE' ? 'webcam' : 'screen'
}

export async function seedViolations(prisma: PrismaClient): Promise<Violation[]> {
  console.log('Seeding Violations...')

  const attempts = await prisma.examAttempt.findMany({
    where: {
      status: { in: ['SUBMITTED', 'AUTO_SUBMITTED'] },
    },
    include: {
      examSchedule: true,
    },
    take: 20,
    orderBy: { startedAt: 'asc' },
  })

  const proctor = await prisma.teacher.findFirst({
    include: { user: true },
    orderBy: { teacherCode: 'asc' },
  })

  const allViolations: Violation[] = []

  for (const [attemptIndex, attempt] of attempts.entries()) {
    const violationCount = attemptIndex % 3
    const storageRoot =
      attempt.examSchedule.proctoringStoragePath ??
      `proctoring/demo/${attempt.examScheduleId}`

    for (let i = 0; i < violationCount; i++) {
      const template = templates[(attemptIndex + i) % templates.length]
      const detectedAt = new Date(attempt.startedAt.getTime() + 1000 * 60 * (i + 1))
      const endedAt = template.durationSeconds
        ? new Date(detectedAt.getTime() + template.durationSeconds * 1000)
        : null
      const violationId = `seed-violation-${attempt.id}-${i + 1}`
      const detectedById = template.detectedBy === 'PROCTOR' ? proctor?.userId ?? null : null
      const reviewedById = template.reviewStatus === 'PENDING' ? null : proctor?.userId ?? null

      const violation = await prisma.violation.upsert({
        where: { id: violationId },
        update: {
          violationType: template.type,
          source: template.source,
          severity: template.severity,
          detectedBy: template.detectedBy,
          reviewStatus: template.reviewStatus,
          description: `Seed ${template.type.toLowerCase().replace(/_/g, ' ')} event for attempt ${attempt.attemptNo}`,
          detectedAt,
          endedAt,
          durationSeconds: template.durationSeconds ?? null,
          detectedById,
          reviewedById,
          reviewedAt: template.reviewStatus === 'PENDING' ? null : endedAt ?? detectedAt,
          reviewNote: template.reviewStatus === 'CONFIRMED' ? 'Seed proctor review: confirmed suspicious behavior.' : null,
        },
        create: {
          id: violationId,
          attemptId: attempt.id,
          violationType: template.type,
          source: template.source,
          severity: template.severity,
          detectedBy: template.detectedBy,
          reviewStatus: template.reviewStatus,
          description: `Seed ${template.type.toLowerCase().replace(/_/g, ' ')} event for attempt ${attempt.attemptNo}`,
          detectedAt,
          endedAt,
          durationSeconds: template.durationSeconds ?? null,
          detectedById,
          reviewedById,
          reviewedAt: template.reviewStatus === 'PENDING' ? null : endedAt ?? detectedAt,
          reviewNote: template.reviewStatus === 'CONFIRMED' ? 'Seed proctor review: confirmed suspicious behavior.' : null,
        },
      })

      if (template.evidenceType) {
        const folder = evidenceFolder(template.evidenceType)
        const fileName = `${violationId}.jpg`
        const objectName = `${storageRoot}/${folder}/${attempt.id}/${fileName}`
        await prisma.violationEvidence.upsert({
          where: { id: `seed-evidence-${violationId}` },
          update: {
            evidenceType: template.evidenceType,
            storageProvider: FileStorageProvider.MINIO,
            bucket: EVIDENCE_BUCKET,
            objectName,
            storagePath: `${storageRoot}/${folder}/${attempt.id}`,
            fileName,
            contentType: 'image/jpeg',
            fileSize: 128_000 + i * 4096,
            capturedAt: detectedAt,
            capturedById: detectedById,
          },
          create: {
            id: `seed-evidence-${violationId}`,
            violationId,
            evidenceType: template.evidenceType,
            storageProvider: FileStorageProvider.MINIO,
            bucket: EVIDENCE_BUCKET,
            objectName,
            storagePath: `${storageRoot}/${folder}/${attempt.id}`,
            fileName,
            contentType: 'image/jpeg',
            fileSize: 128_000 + i * 4096,
            capturedAt: detectedAt,
            capturedById: detectedById,
          },
        })
      }

      allViolations.push(violation)
    }
  }

  console.log(`✓ Violations completed (${allViolations.length})`)
  return allViolations
}
