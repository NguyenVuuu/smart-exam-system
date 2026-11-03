import 'dotenv/config'
import prisma from '../src/lib/prisma'
import { decryptField, encryptField, isEncryptionConfigured } from '../src/lib/encryption'
import { openExamOption, sealExamOption } from '../src/lib/exam-option-secret'
import { openReviewSnapshot, sealReviewSnapshot } from '../src/modules/teacher-exams/repositories/exam-review-snapshot.repository'

type Count = { questions: number; options: number; tests: number; reviewRounds: number }

async function scan<T extends { id: string }>(
  load: (cursor: string | undefined) => Promise<T[]>,
  update: (row: T) => Promise<boolean>,
): Promise<number> {
  let cursor: string | undefined
  let count = 0
  for (;;) {
    const rows = await load(cursor)
    if (!rows.length) return count
    for (const row of rows) if (await update(row)) count++
    cursor = rows[rows.length - 1].id
  }
}

async function main() {
  if (!isEncryptionConfigured()) throw new Error('EXAM_ENCRYPTION_KEY and a valid key ID are required')
  const keyId = process.env.EXAM_ENCRYPTION_KEY_ID || 'primary'
  const prefix = `enc:v2:${keyId}:`
  const rotate = (value: string) => value.startsWith(prefix) ? value : encryptField(decryptField(value))
  const rotateNullable = (value: string | null) => value === null ? null : rotate(value)

  const counts: Count = { questions: 0, options: 0, tests: 0, reviewRounds: 0 }
  counts.questions = await scan(
    (cursor) => prisma.examQuestion.findMany({
      select: { id: true, title: true, content: true, explanation: true }, orderBy: { id: 'asc' }, take: 100,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    }),
    async (row) => {
      if (row.title.startsWith(prefix) && row.content.startsWith(prefix)
        && (row.explanation === null || row.explanation.startsWith(prefix))) return false
      await prisma.examQuestion.update({ where: { id: row.id }, data: {
        title: rotate(row.title), content: rotate(row.content), explanation: rotateNullable(row.explanation),
      } })
      return true
    },
  )
  counts.options = await scan(
    (cursor) => prisma.examQuestionOption.findMany({
      select: { id: true, content: true, isCorrect: true }, orderBy: { id: 'asc' }, take: 100,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    }),
    async (row) => {
      if (row.content.startsWith(prefix) && !row.isCorrect && openExamOption(row).sealed) return false
      const opened = openExamOption(row)
      await prisma.examQuestionOption.update({ where: { id: row.id }, data: sealExamOption(opened.content, opened.isCorrect) })
      return true
    },
  )
  counts.tests = await scan(
    (cursor) => prisma.programmingTestCase.findMany({
      select: { id: true, input: true, expectedOutput: true }, orderBy: { id: 'asc' }, take: 100,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    }),
    async (row) => {
      if (row.input.startsWith(prefix) && row.expectedOutput.startsWith(prefix)) return false
      await prisma.programmingTestCase.update({ where: { id: row.id }, data: {
        input: rotate(row.input), expectedOutput: rotate(row.expectedOutput),
      } })
      return true
    },
  )
  counts.reviewRounds = await scan(
    (cursor) => prisma.examReviewRound.findMany({
      select: { id: true, snapshot: true }, orderBy: { id: 'asc' }, take: 100,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    }),
    async (row) => {
      const raw = row.snapshot
      if (raw && typeof raw === 'object' && !Array.isArray(raw)
        && 'ciphertext' in raw && typeof raw.ciphertext === 'string'
        && raw.ciphertext.startsWith(prefix)) return false
      await prisma.examReviewRound.update({
        where: { id: row.id }, data: { snapshot: sealReviewSnapshot(openReviewSnapshot(raw)) },
      })
      return true
    },
  )
  process.stdout.write(`Exam secrets re-encrypted: ${JSON.stringify(counts)}\n`)
}

main().catch((error) => {
  process.stderr.write(`${String(error)}\n`)
  process.exitCode = 1
}).finally(() => prisma.$disconnect())
