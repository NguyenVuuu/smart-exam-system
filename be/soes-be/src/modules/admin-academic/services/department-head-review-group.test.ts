import assert from 'node:assert/strict'
import test from 'node:test'
import Module from 'node:module'

test('changing department head activates membership and records the change atomically', async (context) => {
  const actions: string[] = []
  const tx = {
    teacher: { findMany: async () => [{ id: 'old-head' }] },
    departmentReviewGroup: { findUnique: async () => ({ id: 'group' }) },
    departmentReviewMember: { upsert: async () => { actions.push('member-upsert') } },
    auditLog: { create: async ({ data }: { data: { metadata: { before: string[]; after: string } } }) => {
      assert.deepEqual(data.metadata, { before: ['old-head'], after: 'new-head' })
      actions.push('audit')
    } },
  }
  const transactionId = require.resolve('../../../utils/transaction')
  const repositoryId = require.resolve('../repositories/department.repository')
  const groupRepositoryId = require.resolve('../../exam-review-groups/repositories/review-group.repository')
  const serviceId = require.resolve('./department.service')
  const originals = new Map([transactionId, repositoryId, groupRepositoryId, serviceId].map((id) => [id, require.cache[id]]))
  function stub(id: string, exports: unknown) {
    const module = new Module(id)
    module.exports = exports
    module.loaded = true
    require.cache[id] = module
  }
  stub(transactionId, { runSerializable: async (work: (client: typeof tx) => Promise<unknown>) => work(tx) })
  stub(repositoryId, {
    findDepartment: async () => ({ id: 'department' }),
    findTeacherForHeadAssignment: async () => ({ id: 'new-head', status: 'ACTIVE', departmentId: 'department', user: { status: 'ACTIVE' } }),
    assignDepartmentHead: async () => { actions.push('head-assigned'); return { id: 'new-head' } },
  })
  stub(groupRepositoryId, { refreshOpenRounds: async () => { actions.push('rounds-refreshed') } })
  delete require.cache[serviceId]
  context.after(() => {
    for (const [id, original] of originals) {
      if (original) require.cache[id] = original
      else delete require.cache[id]
    }
  })

  const service = require('./department.service') as typeof import('./department.service')
  await service.assignHead('department', 'new-head', 'admin-user')
  assert.deepEqual(actions, ['head-assigned', 'member-upsert', 'rounds-refreshed', 'audit'])
})
