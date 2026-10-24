import assert from 'node:assert/strict'
import test from 'node:test'
import Module from 'node:module'

test('ready final exams include legacy approvals and only the latest approved round', async (context) => {
  const repositoryId = require.resolve('../repositories/exam-schedule.repository')
  const serviceId = require.resolve('./exam-schedule.service')
  const originalRepository = require.cache[repositoryId]
  const originalService = require.cache[serviceId]
  const stub = new Module(repositoryId)
  stub.exports = {
    listReadyFinalExams: async () => [
      { id: 'legacy', reviewRounds: [] },
      { id: 'current-approved', reviewRounds: [{ status: 'APPROVED' }] },
      { id: 'waiting', reviewRounds: [{ status: 'PENDING' }] },
      { id: 'needs-revision', reviewRounds: [{ status: 'REVISION_REQUESTED' }] },
    ],
  }
  stub.loaded = true
  require.cache[repositoryId] = stub
  delete require.cache[serviceId]
  context.after(() => {
    if (originalRepository) require.cache[repositoryId] = originalRepository
    else delete require.cache[repositoryId]
    if (originalService) require.cache[serviceId] = originalService
    else delete require.cache[serviceId]
  })
  const service = require('./exam-schedule.service') as typeof import('./exam-schedule.service')
  assert.deepEqual((await service.listReadyExams()).map((exam) => exam.id), ['legacy', 'current-approved'])
})
