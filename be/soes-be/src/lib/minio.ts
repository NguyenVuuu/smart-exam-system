import { randomUUID } from 'crypto'
import { extname } from 'path'
import { Client } from 'minio'
import { minioConfig } from '../config'

let client: Client | null = null
let evidenceBucketReady: Promise<void> | null = null

function getClient(): Client {
  if (client) return client

  client = new Client({
    endPoint: minioConfig.endPoint,
    port: minioConfig.port,
    useSSL: minioConfig.useSSL,
    accessKey: minioConfig.accessKey,
    secretKey: minioConfig.secretKey,
  })

  return client
}

function safePathPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '-')
}

async function ensureEvidenceBucket(): Promise<void> {
  if (evidenceBucketReady) return evidenceBucketReady

  evidenceBucketReady = (async () => {
    const minio = getClient()
    const exists = await minio.bucketExists(minioConfig.evidenceBucket)
    if (!exists) {
      await minio.makeBucket(minioConfig.evidenceBucket)
    }
  })()

  return evidenceBucketReady
}

function evidenceObjectName(input: {
  attemptId: string
  violationType: string
  detectedAt: Date
  originalName: string
}): string {
  const extension = extname(input.originalName).toLowerCase() || '.jpg'
  const timestamp = input.detectedAt.toISOString().replace(/[:.]/g, '-')

  return [
    'violations',
    safePathPart(input.attemptId),
    safePathPart(input.violationType),
    `${timestamp}-${randomUUID()}${extension}`,
  ].join('/')
}

export async function uploadViolationEvidenceFiles(input: {
  attemptId: string
  violationType: string
  detectedAt: Date
  files: Express.Multer.File[]
}): Promise<string[]> {
  if (input.files.length === 0) return []

  await ensureEvidenceBucket()
  const minio = getClient()

  const uploadedObjectNames: string[] = []
  for (const file of input.files) {
    const objectName = evidenceObjectName({
      attemptId: input.attemptId,
      violationType: input.violationType,
      detectedAt: input.detectedAt,
      originalName: file.originalname,
    })

    await minio.putObject(
      minioConfig.evidenceBucket,
      objectName,
      file.buffer,
      file.size,
      { 'Content-Type': file.mimetype },
    )

    uploadedObjectNames.push(objectName)
  }

  return uploadedObjectNames
}

export async function getViolationEvidenceUrl(objectName: string): Promise<string> {
  await ensureEvidenceBucket()
  return getClient().presignedGetObject(
    minioConfig.evidenceBucket,
    objectName,
    minioConfig.evidenceUrlExpirySeconds,
  )
}
