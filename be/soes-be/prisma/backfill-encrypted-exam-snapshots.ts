import 'dotenv/config'
import prisma from '../src/lib/prisma'
import { isEncryptionConfigured } from '../src/lib/encryption'
import { sealReviewSnapshot } from '../src/modules/teacher-exams/repositories/exam-review-snapshot.repository'

async function main() {
  if (!isEncryptionConfigured()) throw new Error('EXAM_ENCRYPTION_KEY must be configured before backfill')
  let cursor: string | undefined
  let migrated = 0
  for (;;) {
    const rows = await prisma.examReviewRound.findMany({
      select: { id: true, snapshot: true },
      orderBy: { id: 'asc' },
      take: 100,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })
    if (!rows.length) break
    for (const row of rows) {
      const snapshot = row.snapshot
      if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
        throw new Error(`Invalid review snapshot for round ${row.id}`)
      }
      if ('format' in snapshot) {
        if (snapshot.format !== 'AES_256_GCM_V1') throw new Error(`Unknown snapshot format for round ${row.id}`)
        continue
      }
      await prisma.examReviewRound.update({
        where: { id: row.id },
        data: { snapshot: sealReviewSnapshot(snapshot) },
      })
      migrated++
    }
    cursor = rows[rows.length - 1].id
  }
  process.stdout.write(`Encrypted ${migrated} legacy review snapshots.\n`)
}

main().catch((error) => {
  process.stderr.write(`${String(error)}\n`)
  process.exitCode = 1
}).finally(() => prisma.$disconnect())
