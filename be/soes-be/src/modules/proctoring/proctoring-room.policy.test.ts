import assert from 'node:assert/strict'
import { test } from 'node:test'
import { attemptRoom, isTeacherRole, joinStudentAttemptRoom, scheduleRoom } from './proctoring-room.policy'

test('student attempt room cannot receive schedule-wide violations or another attempt stream', async () => {
  const joined = new Set<string>()
  await joinStudentAttemptRoom({ join: (room) => { joined.add(room) } }, 'attempt-a')
  assert.deepEqual([...joined], [attemptRoom('attempt-a')])
  assert.equal(joined.has(scheduleRoom('schedule-a')), false)
  assert.equal(joined.has(attemptRoom('attempt-b')), false)
})

test('only teacher roles can subscribe to schedule-wide events', () => {
  assert.equal(isTeacherRole('TEACHER'), true)
  assert.equal(isTeacherRole('DEPARTMENT_HEAD'), true)
  assert.equal(isTeacherRole('STUDENT'), false)
  assert.equal(isTeacherRole('ADMIN'), false)
  assert.equal(isTeacherRole('EDUCATION_OFFICER'), false)
})
