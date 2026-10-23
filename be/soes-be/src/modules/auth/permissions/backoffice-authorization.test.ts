import assert from 'node:assert/strict'
import test from 'node:test'
import Module from 'node:module'
import type { Request, Response } from 'express'
import { AppError } from '../../../errors/AppError'
import type { BackofficePermission } from './backoffice-permissions'

test('backoffice middleware checks current account status and grants on each request', async (context) => {
  const account = {
    id: 'profile', userId: 'user', role: 'EDUCATION_OFFICER', status: 'ACTIVE',
    permissionOverrides: [] as Array<{ permission: string; allowed: boolean }>,
  }
  let rolePermissions = ['ACADEMIC_VIEW', 'SCHEDULES_VIEW', 'SCHEDULES_MANAGE'].map((permission) => ({ permission }))
  const id = require.resolve('../../../lib/prisma')
  const original = require.cache[id]
  let lookups = 0
  const stub = new Module(id)
  stub.exports = { __esModule: true, default: {
    admin: { findUnique: async () => { lookups++; return account } },
    backofficeRolePermission: { findMany: async () => rolePermissions },
  } }
  stub.loaded = true
  require.cache[id] = stub
  context.after(() => { if (original) require.cache[id] = original; else delete require.cache[id] })
  const { requireBackoffice } = require('../middlewares/requireBackoffice') as typeof import('../middlewares/requireBackoffice')
  async function check(permission: BackofficePermission, user: Request['user'] = {
    id: 'user', profileId: 'profile', role: 'EDUCATION_OFFICER',
  }) {
    const request = { user } as Request
    let error: unknown
    await requireBackoffice(permission)(request, {} as Response, (caught) => { error = caught })
    return error instanceof AppError ? error.statusCode : error ? 500 : 200
  }
  assert.equal(await check('SCHEDULES_VIEW'), 200)
  assert.equal(await check('USERS_VIEW'), 403)
  rolePermissions = [...rolePermissions, { permission: 'REPORTS_VIEW' }]
  assert.equal(await check('REPORTS_VIEW'), 200)
  rolePermissions = rolePermissions.filter(({ permission }) => permission !== 'REPORTS_VIEW')
  assert.equal(await check('REPORTS_VIEW'), 403)
  account.permissionOverrides = [{ permission: 'USERS_MANAGE', allowed: true }]
  assert.equal(await check('USERS_VIEW'), 200)
  assert.equal(await check('USERS_MANAGE'), 200)
  account.permissionOverrides = [{ permission: 'USERS_MANAGE', allowed: false }]
  assert.equal(await check('USERS_MANAGE'), 403)
  account.status = 'INACTIVE'
  assert.equal(await check('SCHEDULES_VIEW'), 403)
  account.status = 'ACTIVE'
  assert.equal(await check('SCHEDULES_VIEW', { id: 'other', profileId: 'profile', role: 'EDUCATION_OFFICER' }), 403)
  assert.equal(await check('SCHEDULES_VIEW', { id: 'user', profileId: 'profile', role: 'ADMIN' }), 403)
  const calls = lookups
  assert.equal(await check('SCHEDULES_VIEW', { id: 'user', profileId: 'profile', role: 'STUDENT' }), 403)
  assert.equal(lookups, calls)
})
