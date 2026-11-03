import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { after, before, test } from 'node:test'
import type { Prisma } from '@prisma/client'
import { decryptField } from '../../../lib/encryption'
import { createExamQuestion } from './exam-question-snapshot.repository'

const originalKey = process.env.EXAM_ENCRYPTION_KEY
before(() => { process.env.EXAM_ENCRYPTION_KEY = randomBytes(32).toString('hex') })
after(() => {
  if (originalKey === undefined) delete process.env.EXAM_ENCRYPTION_KEY
  else process.env.EXAM_ENCRYPTION_KEY = originalKey
})

test('exam snapshot encrypts programming test input and expected output', async () => {
  let data: Record<string, any> | undefined
  const tx = { examQuestion: { create: async (input: { data: Record<string, any> }) => { data = input.data; return input.data } } } as unknown as Prisma.TransactionClient
  await createExamQuestion(tx, 'exam-1', {
    question: {
      id: 'question-1', title: 'Title', content: 'Content', explanation: null,
      type: 'PROGRAMMING', difficulty: 'EASY', language: 'JAVA', options: [],
      programmingConfig: null,
      programmingTests: [{ input: 'PRIVATE-INPUT', expectedOutput: 'PRIVATE-OUTPUT', isSample: false, isHidden: true }],
    },
    points: 10, orderIndex: 1,
  })
  const stored = data?.programmingTests.create[0]
  assert.notEqual(stored.input, 'PRIVATE-INPUT')
  assert.notEqual(stored.expectedOutput, 'PRIVATE-OUTPUT')
  assert.equal(decryptField(stored.input), 'PRIVATE-INPUT')
  assert.equal(decryptField(stored.expectedOutput), 'PRIVATE-OUTPUT')
})
