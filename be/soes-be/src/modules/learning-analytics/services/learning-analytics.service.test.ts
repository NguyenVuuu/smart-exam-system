import assert from 'node:assert/strict'
import { mock, test } from 'node:test'
import * as repo from '../repositories/learning-analytics.repository'
import { studentInsights } from './learning-analytics.service'

test('counts only attempts whose answers may be reviewed', async () => {
  const now = new Date('2026-11-13T08:00:00Z')
  const base = {
    status: 'GRADED', studentAnswers: [], attemptQuestions: [],
    examSchedule: {
      endTime: new Date('2026-11-13T07:00:00Z'), resultReleaseMode: 'IMMEDIATE',
      resultReleaseAt: null, resultsPublishedAt: null, reviewPolicy: 'ANSWERS_NO_KEY',
    },
  }
  const find = mock.method(repo, 'findReleasedStudentAttempts', async () => [
    { ...base, id: 'reviewable' },
    { ...base, id: 'not-reviewable', examSchedule: { ...base.examSchedule, reviewPolicy: 'NONE' } },
  ] as never)
  try {
    const result = await studentInsights('student-1', now)
    assert.equal(result.analyzedAttemptCount, 1)
    assert.equal(result.limitedToRecentAttempts, false)
  } finally {
    find.mock.restore()
  }
})
