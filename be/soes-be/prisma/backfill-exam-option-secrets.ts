import 'dotenv/config'
import prisma from '../src/lib/prisma'
import { isEncryptionConfigured } from '../src/lib/encryption'
import { openExamOption, sealExamOption } from '../src/lib/exam-option-secret'

async function main() {
  if (!isEncryptionConfigured()) throw new Error('EXAM_ENCRYPTION_KEY must be configured before backfill')
  let cursor: string | undefined
  let migrated = 0
  for (;;) {
    const rows = await prisma.examQuestionOption.findMany({
      select: { id: true, content: true, isCorrect: true },
      orderBy: { id: 'asc' },
      take: 100,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })
    if (!rows.length) break
    for (const row of rows) {
      const opened = openExamOption(row)
      if (opened.sealed) continue
      await prisma.examQuestionOption.update({
        where: { id: row.id },
        data: sealExamOption(opened.content, opened.isCorrect),
      })
      migrated++
    }
    cursor = rows[rows.length - 1].id
  }
  process.stdout.write(`Encrypted ${migrated} legacy exam options.\n`)
}

main().catch((error) => {
  process.stderr.write(`${String(error)}\n`)
  process.exitCode = 1
}).finally(() => prisma.$disconnect())
