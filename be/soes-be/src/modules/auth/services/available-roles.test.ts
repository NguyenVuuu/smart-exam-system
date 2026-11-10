import assert from 'node:assert/strict'
import test from 'node:test'
import type { AccountRole } from '../../../utils/jwt'
import type { UserWithProfiles } from '../repositories/auth.repository'
import { resolveAvailableRoles } from './available-roles'

function account(roles: AccountRole[], position: string, withStudent = false): UserWithProfiles {
  return {
    roles,
    username: 'T001',
    teachers: [{ id: 'teacher-1', status: 'ACTIVE', position }],
    students: withStudent ? [{ id: 'student-1', status: 'ACTIVE' }] : [],
    admins: [],
  } as unknown as UserWithProfiles
}

test('a department head with a teacher role signs in as department head only', () => {
  const roles = resolveAvailableRoles(account(['TEACHER', 'DEPARTMENT_HEAD'], 'DEPARTMENT_HEAD'))
  assert.deepEqual(roles.map(({ role }) => role), ['DEPARTMENT_HEAD'])
  assert.equal(roles[0].profileId, 'teacher-1')
})

test('a department head who is also a student still chooses between distinct profiles', () => {
  const roles = resolveAvailableRoles(account(['TEACHER', 'DEPARTMENT_HEAD', 'STUDENT'], 'DEPARTMENT_HEAD', true))
  assert.deepEqual(roles.map(({ role }) => role), ['DEPARTMENT_HEAD', 'STUDENT'])
})

test('a lecturer keeps the teacher role and old accounts infer the head role from position', () => {
  assert.deepEqual(resolveAvailableRoles(account(['TEACHER'], 'LECTURER')).map(({ role }) => role), ['TEACHER'])
  assert.deepEqual(resolveAvailableRoles(account([], 'DEPARTMENT_HEAD')).map(({ role }) => role), ['DEPARTMENT_HEAD'])
})
