import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validateExamMatrix } from './exam-matrix.service'

const rows = [
  { difficulty: 'EASY' as const, type: 'SINGLE_CHOICE' as const, count: 3 },
  { difficulty: 'MEDIUM' as const, type: 'PROGRAMMING' as const, count: 2 },
]

test('rejects a matrix that exceeds the bank or changes the requested total', () => {
  assert.throws(() => validateExamMatrix({ easyCount: 4, mediumCount: 1, hardCount: 0, rationale: '' }, 5, 'MIXED', rows))
  assert.throws(() => validateExamMatrix({ easyCount: 2, mediumCount: 1, hardCount: 0, rationale: '' }, 5, 'MIXED', rows))
})

test('mixed proposal must contain both objective and programming questions', () => {
  assert.throws(() => validateExamMatrix({ easyCount: 3, mediumCount: 0, hardCount: 0, rationale: '' }, 3, 'MIXED', rows))
  assert.doesNotThrow(() => validateExamMatrix({ easyCount: 2, mediumCount: 1, hardCount: 0, rationale: '' }, 3, 'MIXED', rows))
})
