import assert from 'node:assert/strict'
import { test } from 'node:test'
import { scheduleBodySchema } from './exam-schedule.validator'

const startTime = new Date(Date.now() + 86_400_000)
const endTime = new Date(startTime.getTime() + 90 * 60_000)

function validSchedule() {
  return {
    title: 'Ca thi cuối kỳ môn Cơ sở dữ liệu', examId: 'exam-1',
    startTime, endTime, durationMinutes: 90, maxAttempts: 1,
    status: 'SCHEDULED',
    courses: [{ courseOfferingId: 'class-1', teacherIds: ['teacher-1'] }],
  }
}

test('a scheduled final exam accepts a valid class and proctor assignment', () => {
  assert.equal(scheduleBodySchema.safeParse(validSchedule()).success, true)
})

test('one proctor cannot supervise two course offerings in the same schedule', () => {
  const schedule = validSchedule()
  schedule.courses.push({ courseOfferingId: 'class-2', teacherIds: ['teacher-1'] })
  const result = scheduleBodySchema.safeParse(schedule)
  assert.equal(result.success, false)
  if (!result.success) assert.ok(result.error.issues.some((issue) => issue.path[0] === 'courses'))
})

test('exam duration and scheduled release stay within the permitted time window', () => {
  assert.equal(scheduleBodySchema.safeParse({ ...validSchedule(), durationMinutes: 91 }).success, false)
  assert.equal(scheduleBodySchema.safeParse({
    ...validSchedule(), resultReleaseMode: 'SCHEDULED', resultReleaseAt: endTime,
  }).success, false)
})
