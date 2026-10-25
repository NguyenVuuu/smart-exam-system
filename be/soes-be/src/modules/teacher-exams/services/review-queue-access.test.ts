import assert from 'node:assert/strict'
import test from 'node:test'
import Module from 'node:module'

test('review queue exposes snapshots only to current group members, including the author', async (context) => {
  let member = true
  const round = {
    id: 'round', version: 1, status: 'PENDING', submittedAt: new Date(),
    exam: { id: 'exam', createdById: 'teacher' },
    snapshot: { question: 'unpublished', correctAnswer: 'secret' },
  }
  const repositoryId = require.resolve('../repositories/teacher-exams.repository')
  const mapperId = require.resolve('../mappers/teacher-exam.mapper')
  const serviceId = require.resolve('./teacher-exams.service')
  const originals = new Map([repositoryId, mapperId, serviceId].map((id) => [id, require.cache[id]]))
  function stub(id: string, exports: unknown) {
    const module = new Module(id)
    module.exports = exports
    module.loaded = true
    require.cache[id] = module
  }
  stub(repositoryId, {
    findReviewerGroup: async () => ({
      status: 'ACTIVE', user: { status: 'ACTIVE' },
      department: { status: 'ACTIVE', reviewGroup: { id: 'group', status: 'ACTIVE', members: member ? [{ id: 'membership' }] : [] } },
    }),
    listApprovals: async (groupId: string) => {
      assert.equal(groupId, 'group')
      return [1, [round]]
    },
    findApprovalRound: async (groupId: string, examId: string) => {
      assert.equal(groupId, 'group')
      return examId === 'exam' ? round : null
    },
    findExam: async (examId: string) => examId === 'exam' ? { id: 'exam', createdById: 'teacher' } : { id: examId, createdById: 'another-teacher' },
    findOwnedReviewHistory: async () => [{ id: 'round', version: 1, status: 'PENDING' }],
  })
  stub(mapperId, { toTeacherExamDto: (exam: { id: string }) => ({ id: exam.id }) })
  delete require.cache[serviceId]
  context.after(() => {
    for (const [id, original] of originals) {
      if (original) require.cache[id] = original
      else delete require.cache[id]
    }
  })
  const service = require('./teacher-exams.service') as typeof import('./teacher-exams.service')
  const query = { page: 1, pageSize: 20, status: 'PENDING' as const }

  const list = await service.listApprovals('teacher', query)
  assert.equal(list.items.length, 1)
  assert.equal('snapshot' in list.items[0], false)
  const detail = await service.getApproval('teacher', 'exam')
  assert.deepEqual(detail.snapshot, round.snapshot)
  await assert.rejects(service.getApproval('teacher', 'other-exam'), { statusCode: 404 })
  assert.equal((await service.getReviewHistory('teacher', 'exam')).length, 1)
  await assert.rejects(service.getReviewHistory('teacher', 'other-exam'), { statusCode: 404 })

  member = false
  await assert.rejects(service.listApprovals('teacher', query), { statusCode: 403 })
  await assert.rejects(service.getApproval('teacher', 'exam'), { statusCode: 403 })
})
