import assert from 'node:assert/strict'
import { test } from 'node:test'
import { examMatrixRequestSchema } from './ai-agent.validator'

const request = {
  subjectId: 'subj-cpp',
  format: 'OBJECTIVE',
  desiredCount: 10,
  message: 'Ưu tiên câu trung bình',
}

test('accepts seeded subject IDs used by teacher courses', () => {
  assert.equal(examMatrixRequestSchema.parse(request).subjectId, 'subj-cpp')
})

test('rejects missing or excessively long subject IDs', () => {
  assert.equal(examMatrixRequestSchema.safeParse({ ...request, subjectId: '' }).success, false)
  assert.equal(examMatrixRequestSchema.safeParse({ ...request, subjectId: 'x'.repeat(101) }).success, false)
})
