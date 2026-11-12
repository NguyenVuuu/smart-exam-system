import assert from 'node:assert/strict'
import { test } from 'node:test'
import { reviewableSubmissionWhere } from './programming-review.repository'

test('programming review is scoped to the teacher, submitted attempt, and selected question', () => {
  const where = reviewableSubmissionWhere('teacher-1', 'attempt-1', 'question-1')
  assert.equal(where.attempt.courseOffering.teacherId, 'teacher-1')
  assert.equal(where.attemptId, 'attempt-1')
  assert.equal(where.examQuestionId, 'question-1')
  assert.deepEqual(where.attempt.status.in, ['AUTO_SUBMITTED', 'GRADED', 'PUBLISHED'])
  assert.equal(where.attempt.invalidatedAt, null)
  assert.equal(where.examQuestion.type, 'PROGRAMMING')
})
