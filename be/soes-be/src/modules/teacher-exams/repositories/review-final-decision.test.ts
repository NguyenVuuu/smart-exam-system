import assert from 'node:assert/strict'
import test from 'node:test'
import Module from 'node:module'

type State = {
  roundStatus: 'PENDING' | 'APPROVED' | 'REVISION_REQUESTED'
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  examStatus: 'DRAFT' | 'READY'
  membershipStatus: 'ACTIVE' | 'INACTIVE'
  decisionCount: number
  auditCount: number
  failAudit: boolean
}

test('one atomic review decision wins, including a decision by the author', async (context) => {
  const state: State = {
    roundStatus: 'PENDING', approvalStatus: 'PENDING', examStatus: 'DRAFT',
    membershipStatus: 'ACTIVE', decisionCount: 0, auditCount: 0, failAudit: false,
  }
  function txFor(local: State) {
    return {
      teacher: { findUnique: async ({ where }: { where: { id: string } }) => ({
        id: where.id, status: 'ACTIVE', departmentId: 'department', userId: `user-${where.id}`, user: { status: 'ACTIVE' },
      }) },
      examReviewRound: {
        findFirst: async () => ({
          id: 'round', version: 1, status: local.roundStatus, groupId: 'group',
          exam: { id: 'exam', type: 'FINAL', status: local.examStatus, approvalStatus: local.approvalStatus, subject: { departmentId: 'department' } },
          group: { departmentId: 'department', status: 'ACTIVE', department: { status: 'ACTIVE' } },
        }),
        updateMany: async ({ data }: { data: { status: State['roundStatus'] } }) => {
          if (local.roundStatus !== 'PENDING') return { count: 0 }
          local.roundStatus = data.status
          return { count: 1 }
        },
      },
      departmentReviewMember: { findUnique: async () => ({ status: local.membershipStatus }) },
      examReviewDecision: { create: async () => { local.decisionCount += 1 } },
      exam: {
        updateMany: async ({ data }: { data: { status: State['examStatus']; approvalStatus: State['approvalStatus'] } }) => {
          if (local.approvalStatus !== 'PENDING') return { count: 0 }
          local.examStatus = data.status
          local.approvalStatus = data.approvalStatus
          return { count: 1 }
        },
        findUniqueOrThrow: async () => ({ id: 'exam', status: local.examStatus, approvalStatus: local.approvalStatus }),
      },
      recordAudit: async () => {
        if (local.failAudit) throw new Error('audit unavailable')
        local.auditCount += 1
      },
    }
  }
  let gate = Promise.resolve()
  const transactionId = require.resolve('../../../utils/transaction')
  const auditId = require.resolve('../../audit-logs/audit-log.writer')
  const repositoryId = require.resolve('./teacher-exam-lifecycle.repository')
  const originals = new Map([transactionId, auditId, repositoryId].map((id) => [id, require.cache[id]]))
  function stub(id: string, exports: unknown) {
    const module = new Module(id)
    module.exports = exports
    module.loaded = true
    require.cache[id] = module
  }
  stub(transactionId, { runSerializable: async (work: (tx: ReturnType<typeof txFor>) => Promise<unknown>) => {
    const previous = gate
    let release!: () => void
    gate = new Promise<void>((resolve) => { release = resolve })
    await previous
    try {
      const local = { ...state }
      const result = await work(txFor(local))
      Object.assign(state, local)
      return result
    } finally {
      release()
    }
  } })
  stub(auditId, { writeAuditLog: async (tx: ReturnType<typeof txFor>) => tx.recordAudit() })
  delete require.cache[repositoryId]
  context.after(() => {
    for (const [id, original] of originals) {
      if (original) require.cache[id] = original
      else delete require.cache[id]
    }
  })
  const repository = require('./teacher-exam-lifecycle.repository') as typeof import('./teacher-exam-lifecycle.repository')

  const selfReviewed = await repository.reviewExam('exam', 'author', true)
  assert.equal(selfReviewed.approvalStatus, 'APPROVED')
  assert.equal(state.roundStatus, 'APPROVED')
  assert.equal(state.decisionCount, 1)
  assert.equal(state.auditCount, 1)
  await assert.rejects(repository.reviewExam('exam', 'other', true), { statusCode: 409 })
  assert.equal(state.decisionCount, 1)

  Object.assign(state, { roundStatus: 'PENDING', approvalStatus: 'PENDING', examStatus: 'DRAFT', decisionCount: 0, auditCount: 0 })
  const concurrent = await Promise.allSettled([
    repository.reviewExam('exam', 'author', true),
    repository.reviewExam('exam', 'other', false, 'Please revise this exam'),
  ])
  assert.equal(concurrent.filter((result) => result.status === 'fulfilled').length, 1)
  assert.equal(state.decisionCount, 1)
  assert.equal(state.auditCount, 1)

  Object.assign(state, { roundStatus: 'PENDING', approvalStatus: 'PENDING', examStatus: 'DRAFT', decisionCount: 0, auditCount: 0, membershipStatus: 'INACTIVE' })
  await assert.rejects(repository.reviewExam('exam', 'author', true), { statusCode: 403 })
  assert.equal(state.decisionCount, 0)
  state.membershipStatus = 'ACTIVE'
  await assert.rejects(repository.reviewExam('exam', 'author', false), { statusCode: 422 })

  state.failAudit = true
  await assert.rejects(repository.reviewExam('exam', 'author', false, 'Please revise this exam'), /audit unavailable/)
  assert.equal(state.roundStatus, 'PENDING')
  assert.equal(state.approvalStatus, 'PENDING')
  assert.equal(state.decisionCount, 0)
})
