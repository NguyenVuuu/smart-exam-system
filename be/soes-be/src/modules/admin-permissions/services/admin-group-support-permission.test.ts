import assert from 'node:assert/strict'
import test from 'node:test'
import Module from 'node:module'

test('group support management can be granted to the education officer role or account', async (context) => {
  const repositoryId = require.resolve('../repositories/admin-permissions.repository')
  const serviceId = require.resolve('./admin-permissions.service')
  const originals = new Map([repositoryId, serviceId].map((id) => [id, require.cache[id]]))
  const grants: string[] = []
  const stub = new Module(repositoryId)
  stub.exports = {
    findAccountById: async () => ({ id: 'officer', role: 'EDUCATION_OFFICER' }),
    updateOverride: async () => { grants.push('account') },
    updateRolePermission: async () => { grants.push('role') },
  }
  stub.loaded = true
  require.cache[repositoryId] = stub
  delete require.cache[serviceId]
  context.after(() => {
    for (const [id, original] of originals) {
      if (original) require.cache[id] = original
      else delete require.cache[id]
    }
  })
  const service = require('./admin-permissions.service') as typeof import('./admin-permissions.service')
  await service.updateOverride({
    adminId: 'officer', permission: 'REVIEW_GROUP_MANAGE_ALL', allowed: true,
    reason: 'Support request', actorUserId: 'admin',
  })
  await service.updateRolePermission({
    role: 'EDUCATION_OFFICER', permission: 'REVIEW_GROUP_MANAGE_ALL', allowed: true,
    reason: 'Support request', actorUserId: 'admin',
  })
  assert.deepEqual(grants, ['account', 'role'])
})
