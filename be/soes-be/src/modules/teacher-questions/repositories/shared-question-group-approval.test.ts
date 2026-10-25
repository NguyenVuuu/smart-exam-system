import assert from 'node:assert/strict'
import test from 'node:test'
import Module from 'node:module'

test('group members can decide their own submitted question once, with a reason for revision', async (context) => {
  const state = { status: 'PENDING', member: 'ACTIVE', group: 'ACTIVE', reason: null as string | null, audits: 0 }
  let gate = Promise.resolve()
  const transactionId = require.resolve('../../../utils/transaction')
  const auditId = require.resolve('../../audit-logs/audit-log.writer')
  const repositoryId = require.resolve('./teacher-questions.repository')
  const originals = new Map([transactionId, auditId, repositoryId].map((id) => [id, require.cache[id]]))
  const stub = (id: string, exports: unknown) => {
    const module = new Module(id)
    module.exports = exports
    module.loaded = true
    require.cache[id] = module
  }
  const makeTx = (local: typeof state) => ({
    teacher: { findUnique: async () => ({ departmentId: 'department', status: 'ACTIVE', userId: 'author-user', user: { status: 'ACTIVE' } }) },
    questionBankItem: {
      findUnique: async () => ({ status: local.status, removedAt: null, question: { subject: { departmentId: 'department', department: { status: 'ACTIVE', reviewGroup: { id: 'group', status: local.group } } } } }),
      updateMany: async ({ data }: { data: { status: string; rejectionReason: string | null } }) => {
        if (local.status !== 'PENDING') return { count: 0 }
        local.status = data.status
        local.reason = data.rejectionReason
        return { count: 1 }
      },
    },
    departmentReviewMember: { findUnique: async () => ({ status: local.member }) },
    recordAudit: async () => { local.audits += 1 },
  })
  stub(transactionId, { runSerializable: async (work: (tx: ReturnType<typeof makeTx>) => Promise<unknown>) => {
    const previous = gate
    let release!: () => void
    gate = new Promise<void>((resolve) => { release = resolve })
    await previous
    try {
      const local = { ...state }
      const result = await work(makeTx(local))
      Object.assign(state, local)
      return result
    } finally { release() }
  } })
  stub(auditId, { writeAuditLog: async (tx: ReturnType<typeof makeTx>) => tx.recordAudit() })
  delete require.cache[repositoryId]
  context.after(() => {
    for (const [id, original] of originals) {
      if (original) require.cache[id] = original
      else delete require.cache[id]
    }
  })
  const repo = require('./teacher-questions.repository') as typeof import('./teacher-questions.repository')

  assert.equal(await repo.reviewBankItem('question-item', 'author', false, 'Cần sửa đáp án.'), true)
  assert.equal(state.status, 'REJECTED')
  assert.equal(state.reason, 'Cần sửa đáp án.')
  assert.equal(state.audits, 1)
  await assert.rejects(repo.reviewBankItem('question-item', 'other', true), { statusCode: 409 })

  Object.assign(state, { status: 'PENDING', reason: null, audits: 0, member: 'INACTIVE' })
  await assert.rejects(repo.reviewBankItem('question-item', 'author', true), { statusCode: 403 })
  assert.equal(state.audits, 0)
  state.member = 'ACTIVE'
  state.group = 'INACTIVE'
  await assert.rejects(repo.reviewBankItem('question-item', 'author', true), { statusCode: 403 })
  state.group = 'ACTIVE'

  const decisions = await Promise.allSettled([
    repo.reviewBankItem('question-item', 'author', true),
    repo.reviewBankItem('question-item', 'other', false, 'Cần sửa nội dung.'),
  ])
  assert.equal(decisions.filter((decision) => decision.status === 'fulfilled').length, 1)
  assert.equal(state.audits, 1)
})
