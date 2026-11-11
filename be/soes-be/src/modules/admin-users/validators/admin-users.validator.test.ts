import assert from 'node:assert/strict'
import test from 'node:test'
import { addUserRoleParamsSchema, addUserRoleSchema, createUserSchema } from './admin-users.validator'

const account = { role: 'STUDENT', code: 'US000123', fullName: 'Nguyen Van A', email: 'a@example.edu' }

test('creates one account with both student and teacher roles', () => {
  const result = createUserSchema.parse({ ...account, roles: ['STUDENT', 'TEACHER'], departmentId: 'department-id' })
  assert.deepEqual(result.roles, ['STUDENT', 'TEACHER'])
})

test('allows a student, teacher, and education officer on one account', () => {
  assert.equal(createUserSchema.safeParse({ ...account, roles: ['STUDENT', 'TEACHER', 'EDUCATION_OFFICER'] }).success, true)
})

test('rejects duplicate, mismatched, and combined administrator roles', () => {
  for (const roles of [
    ['STUDENT', 'STUDENT'], ['TEACHER'], ['STUDENT', 'ADMIN'],
  ]) {
    assert.equal(createUserSchema.safeParse({ ...account, roles }).success, false)
  }
})

test('validates role attachment input', () => {
  assert.equal(addUserRoleSchema.safeParse({ role: 'TEACHER', departmentId: 'department-id' }).success, true)
  assert.equal(addUserRoleSchema.safeParse({ role: 'EDUCATION_OFFICER' }).success, true)
  assert.equal(addUserRoleSchema.safeParse({ role: 'ADMIN' }).success, false)
  assert.equal(addUserRoleSchema.safeParse({ role: 'UNKNOWN' }).success, false)
})

test('accepts existing seeded user IDs when attaching a role', () => {
  assert.equal(addUserRoleParamsSchema.parse({ userId: 'seed-user-teacher-001' }).userId, 'seed-user-teacher-001')
  assert.equal(addUserRoleParamsSchema.safeParse({ userId: '' }).success, false)
})
