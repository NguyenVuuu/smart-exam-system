import assert from 'node:assert/strict'
import test from 'node:test'
import Module from 'node:module'

test('only Admin support can change a group, with same-department members and an audit reason', async (context) => {
  let role: 'ADMIN' | 'EDUCATION_OFFICER' = 'EDUCATION_OFFICER'
  const audit: Array<{ action: string; metadata: { reason: string } }> = []
  const tx = {
    admin: { findUnique: async () => ({ userId: 'user', role, status: 'ACTIVE', user: { status: 'ACTIVE' } }) },
    departmentReviewGroup: { findUnique: async () => ({ departmentId: 'department' }) },
    departmentReviewMember: {
      findUnique: async () => null,
      create: async () => ({ id: 'membership' }),
    },
    auditLog: { create: async ({ data }: { data: { action: string; metadata: { reason: string } } }) => { audit.push(data) } },
  }
  let candidateDepartment = 'other-department'
  let candidatePosition: 'LECTURER' | 'DEPARTMENT_HEAD' = 'LECTURER'
  const transactionId = require.resolve('../../../utils/transaction')
  const repositoryId = require.resolve('../repositories/review-group.repository')
  const auditId = require.resolve('../../audit-logs/audit-log.writer')
  const serviceId = require.resolve('./backoffice-review-group-management.service')
  const originals = new Map([transactionId, repositoryId, auditId, serviceId].map((id) => [id, require.cache[id]]))
  const stub = (id: string, exports: unknown) => {
    const module = new Module(id)
    module.exports = exports
    module.loaded = true
    require.cache[id] = module
  }
  stub(transactionId, { runSerializable: async (work: (client: typeof tx) => Promise<unknown>) => work(tx) })
  stub(repositoryId, {
    findGroup: async () => ({ id: 'group', departmentId: 'department', name: 'Group', status: 'ACTIVE' }),
    findCandidate: async () => ({ departmentId: candidateDepartment, position: candidatePosition, status: 'ACTIVE', user: { status: 'ACTIVE' } }),
    refreshOpenRounds: async () => undefined,
  })
  stub(auditId, { writeAuditLog: async (client: typeof tx, data: { action: string; metadata: { reason: string } }) => client.auditLog.create({ data }) })
  delete require.cache[serviceId]
  context.after(() => {
    for (const [id, original] of originals) {
      if (original) require.cache[id] = original
      else delete require.cache[id]
    }
  })
  const service = require('./backoffice-review-group-management.service') as typeof import('./backoffice-review-group-management.service')

  await assert.rejects(service.addMember('profile', 'user', 'group', 'teacher', 'Hỗ trợ bộ môn'), { statusCode: 403 })
  role = 'ADMIN'
  await assert.rejects(service.addMember('profile', 'user', 'group', 'teacher', 'Hỗ trợ bộ môn'), { statusCode: 403 })
  candidateDepartment = 'department'
  await service.addMember('profile', 'user', 'group', 'teacher', 'Hỗ trợ bộ môn')
  assert.equal(audit.length, 1)
  assert.equal(audit[0].metadata.reason, 'Hỗ trợ bộ môn')
  candidatePosition = 'DEPARTMENT_HEAD'
  await assert.rejects(service.removeMember('profile', 'user', 'group', 'teacher', 'Hỗ trợ bộ môn'), { statusCode: 403 })
})
