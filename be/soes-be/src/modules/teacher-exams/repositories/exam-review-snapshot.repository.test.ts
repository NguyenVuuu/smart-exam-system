import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { after, before, test } from 'node:test'
import { openReviewSnapshot, sealReviewSnapshot } from './exam-review-snapshot.repository'

const originalKey = process.env.EXAM_ENCRYPTION_KEY
before(() => { process.env.EXAM_ENCRYPTION_KEY = randomBytes(32).toString('hex') })
after(() => {
  if (originalKey === undefined) delete process.env.EXAM_ENCRYPTION_KEY
  else process.env.EXAM_ENCRYPTION_KEY = originalKey
})

test('review snapshot stores no exam text or answer in JSON', () => {
  const snapshot = { examQuestions: [{ title: 'PRIVATE-EXAM-TITLE', options: [{ content: 'PRIVATE-ANSWER', isCorrect: true }] }] }
  const sealed = sealReviewSnapshot(snapshot)
  assert.doesNotMatch(JSON.stringify(sealed), /PRIVATE-EXAM-TITLE|PRIVATE-ANSWER/)
  assert.deepEqual(openReviewSnapshot(sealed), snapshot)
})

test('legacy review snapshots remain readable for backfill', () => {
  assert.deepEqual(openReviewSnapshot({ examQuestions: [] }), { examQuestions: [] })
  assert.deepEqual(openReviewSnapshot({ format: 'MULTIPLE_CHOICE', examQuestions: [] }), {
    format: 'MULTIPLE_CHOICE', examQuestions: [],
  })
})

test('corrupted encrypted snapshot is rejected', () => {
  assert.throws(() => openReviewSnapshot({ format: 'AES_256_GCM_V1', ciphertext: 'enc:invalid' }), /authentication|Invalid/)
})
