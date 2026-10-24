import assert from 'node:assert/strict'
import test from 'node:test'
import Module from 'node:module'

test('final exam submission creates a review round without automatic approval', async (context) => {
  const rounds: Array<{ version: number; status: string; submittedById: string }> = []
  const audits: string[] = []
  const state = {
    approvalStatus: 'NOT_REQUIRED',
    groupAvailable: true,
    reviewerCount: 1,
    authorStatus: 'ACTIVE',
    updatedAt: new Date(),
  }
  const tx = {
    exam: {
      findUnique: async () => ({
        id: 'exam', type: 'FINAL', status: 'DRAFT', approvalStatus: state.approvalStatus,
        createdById: 'head', updatedAt: state.updatedAt,
        subject: { departmentId: 'department' },
        _count: { examQuestions: 1 },
        reviewRounds: rounds.slice(-1),
      }),
      updateMany: async () => {
        if (state.approvalStatus === 'PENDING') return { count: 0 }
        state.approvalStatus = 'PENDING'
        return { count: 1 }
      },
      findUniqueOrThrow: async () => ({ id: 'exam', status: 'DRAFT', approvalStatus: state.approvalStatus }),
    },
    teacher: { findUnique: async () => ({ status: state.authorStatus, departmentId: 'department', userId: 'user-head', user: { status: 'ACTIVE' } }) },
    departmentReviewGroup: { findUnique: async () => state.groupAvailable ? { id: 'group', status: 'ACTIVE' } : null },
    departmentReviewMember: { count: async ({ where }: { where: Record<string, unknown> }) => {
      assert.equal('teacherId' in where, false)
      return state.reviewerCount
    } },
    examReviewRound: { create: async ({ data }: { data: { version: number; status: string; submittedById: string } }) => {
      const round = { id: `round-${data.version}`, ...data }
      rounds.push(round)
      return round
    } },
  }
  const transactionId = require.resolve('../../../utils/transaction')
  const snapshotId = require.resolve('./exam-review-snapshot.repository')
  const auditId = require.resolve('../../audit-logs/audit-log.writer')
  const repositoryId = require.resolve('./teacher-exam-lifecycle.repository')
  const originals = new Map([transactionId, snapshotId, auditId, repositoryId].map((id) => [id, require.cache[id]]))
  function stub(id: string, exports: unknown) {
    const module = new Module(id)
    module.exports = exports
    module.loaded = true
    require.cache[id] = module
  }
  stub(transactionId, { runSerializable: async (work: (client: typeof tx) => Promise<unknown>) => work(tx) })
  stub(snapshotId, { readExamReviewSnapshot: async () => ({ title: 'Unpublished exam' }) })
  stub(auditId, { writeAuditLog: async (_tx: typeof tx, data: { action: string }) => { audits.push(data.action) } })
  delete require.cache[repositoryId]
  context.after(() => {
    for (const [id, original] of originals) {
      if (original) require.cache[id] = original
      else delete require.cache[id]
    }
  })
  const repository = require('./teacher-exam-lifecycle.repository') as typeof import('./teacher-exam-lifecycle.repository')

  state.groupAvailable = false
  await assert.rejects(repository.submitFinalExam('exam', 'head'), { statusCode: 409 })
  assert.equal(rounds.length, 0)
  state.groupAvailable = true
  state.authorStatus = 'INACTIVE'
  await assert.rejects(repository.submitFinalExam('exam', 'head'), { statusCode: 403 })
  state.authorStatus = 'ACTIVE'
  state.reviewerCount = 1
  const submitted = await repository.submitFinalExam('exam', 'head')
  assert.equal(submitted.approvalStatus, 'PENDING')
  assert.equal(submitted.status, 'DRAFT')
  assert.deepEqual(rounds.map(({ version, status, submittedById }) => ({ version, status, submittedById })), [
    { version: 1, status: 'PENDING', submittedById: 'head' },
  ])
  assert.deepEqual(audits, ['SUBMIT_FINAL_EXAM_FOR_REVIEW'])
  await assert.rejects(repository.submitFinalExam('exam', 'head'), { statusCode: 409 })
  assert.equal(rounds.length, 1)

  rounds.length = 0
  state.approvalStatus = 'NOT_REQUIRED'
  const concurrent = await Promise.allSettled([
    repository.submitFinalExam('exam', 'head'),
    repository.submitFinalExam('exam', 'head'),
  ])
  assert.equal(concurrent.filter((result) => result.status === 'fulfilled').length, 1)
  assert.equal(rounds.length, 1)
})
