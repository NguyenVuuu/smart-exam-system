import assert from 'node:assert/strict'
import { mock, test } from 'node:test'
import * as repo from '../repositories/learning-analytics.repository'
import { studentInsights, teacherScheduleInsights } from './learning-analytics.service'

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

test('class analysis requires five distinct students even when question count is high', async () => {
  const attempt = (studentId: string) => ({
    studentId, courseOffering: { id: 'course-1', code: 'SE01' }, studentAnswers: [],
    attemptQuestions: [{ examQuestionId: 'question-1', examQuestion: {
      title: 'JOIN', points: 1, exam: { subjectId: 'sql' },
      topics: [{ topicId: 'topic-1', code: 'JOIN', name: 'SQL JOIN' }],
    } }],
  })
  const findSchedule = mock.method(repo, 'findTeacherSchedule', async () => ({ id: 'schedule-1', title: 'SQL' } as never))
  const findAttempts = mock.method(repo, 'findTeacherScheduleAttempts', async () =>
    [attempt('s1'), attempt('s1'), attempt('s2'), attempt('s3'), attempt('s4')] as never)
  try {
    const result = await teacherScheduleInsights('teacher-1', 'schedule-1')
    assert.equal(result.classes[0].studentCount, 4)
    assert.equal(result.classes[0].sufficientData, false)
  } finally {
    findSchedule.mock.restore()
    findAttempts.mock.restore()
  }
})
