import assert from 'node:assert/strict'
import test from 'node:test'
import Module from 'node:module'

test('group support management cannot be granted to the education officer role or account', async (context) => {
  const repositoryId = require.resolve('../repositories/admin-permissions.repository')
  const serviceId = require.resolve('./admin-permissions.service')
  const originals = new Map([repositoryId, serviceId].map((id) => [id, require.cache[id]]))
  const stub = new Module(repositoryId)
  stub.exports = {
    findAccountById: async () => ({ id: 'officer', role: 'EDUCATION_OFFICER' }),
    updateOverride: async () => { throw new Error('Unexpected permission grant') },
    updateRolePermission: async () => { throw new Error('Unexpected role grant') },
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
  await assert.rejects(service.updateOverride({
    adminId: 'officer', permission: 'REVIEW_GROUP_MANAGE_ALL', allowed: true,
    reason: 'Support request', actorUserId: 'admin',
  }), { statusCode: 403 })
  assert.throws(() => service.updateRolePermission({
    role: 'EDUCATION_OFFICER', permission: 'REVIEW_GROUP_MANAGE_ALL', allowed: true,
    reason: 'Support request', actorUserId: 'admin',
  }), { statusCode: 403 })
})
