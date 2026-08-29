import assert from 'node:assert/strict'
import test from 'node:test'
import { scheduleBodySchema } from './exam-schedule.validator'

const validSchedule = {
  title: 'Final exam schedule',
  examId: 'exam-1',
  startTime: '2026-09-01T08:00:00.000Z',
  endTime: '2026-09-01T10:00:00.000Z',
  durationMinutes: 90,
  maxAttempts: 1,
  courses: [{ courseOfferingId: 'course-1', teacherIds: ['teacher-1'] }],
}

test('accepts a valid schedule', () => {
  assert.equal(scheduleBodySchema.safeParse(validSchedule).success, true)
})

test('rejects duplicate course offerings and proctors', () => {
  const assignment = { courseOfferingId: 'course-1', teacherIds: ['teacher-1', 'teacher-1'] }
  const result = scheduleBodySchema.safeParse({ ...validSchedule, courses: [assignment, assignment] })
  assert.equal(result.success, false)
})

test('rejects an end time before the start time', () => {
  const result = scheduleBodySchema.safeParse({ ...validSchedule, endTime: '2026-09-01T07:00:00.000Z' })
  assert.equal(result.success, false)
})
