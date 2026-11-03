import 'dotenv/config'
import prisma from '../src/lib/prisma'
import { encryptField, isEncryptionConfigured } from '../src/lib/encryption'

async function main() {
  if (!isEncryptionConfigured()) throw new Error('EXAM_ENCRYPTION_KEY must be configured before backfill')
  let cursor: string | undefined
  let migrated = 0
  for (;;) {
    const rows = await prisma.programmingTestCase.findMany({
      select: { id: true, input: true, expectedOutput: true },
      orderBy: { id: 'asc' }, take: 100,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })
    if (!rows.length) break
    for (const row of rows) {
      if (row.input.startsWith('enc:') && row.expectedOutput.startsWith('enc:')) continue
      await prisma.programmingTestCase.update({
        where: { id: row.id },
        data: {
          input: row.input.startsWith('enc:') ? row.input : encryptField(row.input),
          expectedOutput: row.expectedOutput.startsWith('enc:') ? row.expectedOutput : encryptField(row.expectedOutput),
        },
      })
      migrated++
    }
    cursor = rows[rows.length - 1].id
  }
  process.stdout.write(`Encrypted ${migrated} legacy exam test cases.\n`)
}

main().catch((error) => {
  process.stderr.write(`${String(error)}\n`)
  process.exitCode = 1
}).finally(() => prisma.$disconnect())
