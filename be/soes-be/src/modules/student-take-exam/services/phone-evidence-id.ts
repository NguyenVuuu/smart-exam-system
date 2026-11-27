import { createHash } from 'node:crypto'
import type { Prisma } from '@prisma/client'

export function phoneEvidenceId(attemptId: string, metadata: Prisma.InputJsonObject, image: Buffer) {
  const digest = createHash('sha256').update(attemptId).update('\0')
    .update(JSON.stringify(metadata)).update('\0').update(image).digest('hex')
  return `${digest.slice(0, 8)}-${digest.slice(8, 12)}-8${digest.slice(13, 16)}-a${digest.slice(17, 20)}-${digest.slice(20, 32)}`
}
