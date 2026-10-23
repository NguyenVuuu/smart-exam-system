import assert from 'node:assert/strict'
import test from 'node:test'
import { BACKOFFICE_PERMISSION_CATALOG, MANAGE_REQUIRES_VIEW, permissionChangesWithDependencies, resolveBackofficePermissions } from './backoffice-permissions'

const adminGrants = BACKOFFICE_PERMISSION_CATALOG.map(({ key }) => ({ permission: key }))
const educationOfficerGrants = ['ACADEMIC_VIEW', 'SCHEDULES_VIEW', 'SCHEDULES_MANAGE'].map((permission) => ({ permission }))

test('administrator grants come from the stored role policy', () => {
  assert.deepEqual(
    resolveBackofficePermissions(adminGrants, []),
    BACKOFFICE_PERMISSION_CATALOG.map(({ key }) => key),
  )
  assert.deepEqual(resolveBackofficePermissions([], []), [])
})

test('each permission maps to one module and one available action', () => {
  const cells = BACKOFFICE_PERMISSION_CATALOG.map(({ module, action }) => `${module}:${action}`)
  assert.equal(new Set(cells).size, cells.length)
  for (const item of BACKOFFICE_PERMISSION_CATALOG) {
    if (item.action === 'MANAGE') {
      assert.equal(cells.includes(`${item.module}:VIEW`), true)
    }
  }
})

test('education officer grants come from the stored role policy', () => {
  assert.deepEqual(resolveBackofficePermissions(educationOfficerGrants, []), [
    'ACADEMIC_VIEW', 'SCHEDULES_VIEW', 'SCHEDULES_MANAGE',
  ])
})

test('overrides grant and revoke ordinary permissions', () => {
  assert.deepEqual(resolveBackofficePermissions(educationOfficerGrants, [
    { permission: 'SCHEDULES_MANAGE', allowed: false },
    { permission: 'REPORTS_VIEW', allowed: true },
    { permission: 'UNKNOWN', allowed: true },
  ]), ['ACADEMIC_VIEW', 'SCHEDULES_VIEW', 'REPORTS_VIEW'])
})

test('education officers can receive any catalog permission through an override', () => {
  const permissions = resolveBackofficePermissions(educationOfficerGrants, [
    { permission: 'ACADEMIC_MANAGE', allowed: true },
    { permission: 'USERS_MANAGE', allowed: true },
    { permission: 'SETTINGS_MANAGE', allowed: true },
  ])
  assert.equal(permissions.includes('ACADEMIC_MANAGE'), true)
  assert.equal(permissions.includes('USERS_MANAGE'), true)
  assert.equal(permissions.includes('SETTINGS_MANAGE'), true)
})

test('management includes viewing unless an account explicitly denies viewing', () => {
  const grants = [{ permission: 'QUESTION_BANK_MANAGE' }]
  const inherited = resolveBackofficePermissions(grants, [])
  assert.equal(inherited.includes('QUESTION_BANK_VIEW'), true)
  const denied = resolveBackofficePermissions(grants, [{ permission: 'QUESTION_BANK_VIEW', allowed: false }])
  assert.equal(denied.includes('QUESTION_BANK_VIEW'), false)
  assert.equal(denied.includes('QUESTION_BANK_MANAGE'), false)
})

test('revoking view also revokes management for every domain', () => {
  for (const [manage, view] of MANAGE_REQUIRES_VIEW) {
    const changes = permissionChangesWithDependencies(view, false)
    assert.deepEqual(changes, [{ permission: view, allowed: false }, { permission: manage, allowed: false }])
    const permissions = resolveBackofficePermissions(adminGrants, changes as Array<{ permission: string; allowed: boolean }>)
    assert.equal(permissions.includes(view), false)
    assert.equal(permissions.includes(manage), false)
  }
})

test('account overrides follow role changes unless explicitly set', () => {
  const grants = [{ permission: 'ACADEMIC_VIEW' }]
  assert.deepEqual(resolveBackofficePermissions(grants, []), ['ACADEMIC_VIEW'])
  grants.push({ permission: 'REPORTS_VIEW' })
  assert.deepEqual(resolveBackofficePermissions(grants, []), ['ACADEMIC_VIEW', 'REPORTS_VIEW'])
  assert.deepEqual(resolveBackofficePermissions(grants, [{ permission: 'REPORTS_VIEW', allowed: false }]), ['ACADEMIC_VIEW'])
  assert.deepEqual(resolveBackofficePermissions(grants, [{ permission: 'REPORTS_VIEW', allowed: true }]), ['ACADEMIC_VIEW', 'REPORTS_VIEW'])
  grants.push({ permission: 'USERS_MANAGE' })
  const denied = resolveBackofficePermissions(grants, [{ permission: 'USERS_VIEW', allowed: false }])
  assert.equal(denied.includes('USERS_VIEW'), false)
  assert.equal(denied.includes('USERS_MANAGE'), false)
})

test('granting management grants viewing and restoring changes only the chosen override', () => {
  for (const [manage, view] of MANAGE_REQUIRES_VIEW) {
    assert.deepEqual(permissionChangesWithDependencies(manage, true), [
      { permission: manage, allowed: true }, { permission: view, allowed: true },
    ])
    assert.deepEqual(permissionChangesWithDependencies(manage, null), [{ permission: manage, allowed: null }])
  }
})
