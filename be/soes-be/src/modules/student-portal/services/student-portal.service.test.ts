import assert from 'node:assert/strict'
import Module from 'node:module'
import { test } from 'node:test'

test('schedule status uses total attempts even when only the latest attempt is loaded', async context => {
  const repositoryId = require.resolve('../repositories/student-portal.repository')
  const serviceId = require.resolve('./student-portal.service')
  const original = require.cache[repositoryId]
  const pageId = require.resolve('../repositories/schedule-page.repository')
  const originalPage = require.cache[pageId]
  const row = (id: string, attempts: number) => ({
    id, title: id, maxAttempts: 2, passwordHash: null, scheduleCourses: [],
    startTime: new Date(Date.now() - 60_000), endTime: new Date(Date.now() + 60_000),
    attempts: [{ id: 'latest', status: 'EXPIRED', deadlineAt: new Date(0) }],
    _count: { attempts },
  })
  const stub = new Module(repositoryId)
  stub.exports = { listVisibleSchedules: async () => [row('used-all', 2), row('can-retry', 1)] }
  require.cache[repositoryId] = stub
  const pageStub = new Module(pageId)
  pageStub.exports = { findVisibleSchedulePage: async () => ({ ids: ['used-all', 'can-retry'], total: 2,
    statusCounts: { OPEN: 1, UPCOMING: 0, COMPLETED: 1, EXPIRED: 0 } }) }
  require.cache[pageId] = pageStub
  context.after(() => {
    if (original) require.cache[repositoryId] = original
    else delete require.cache[repositoryId]
    delete require.cache[serviceId]
    if (originalPage) require.cache[pageId] = originalPage
    else delete require.cache[pageId]
  })
  const { getExamSchedules } = await import('./student-portal.service')
  const result = await getExamSchedules('student', { page: 1, pageSize: 10, status: 'ALL' })
  assert.deepEqual(result.items.map(({ id, status, canStart }) => ({ id, status, canStart })), [
    { id: 'used-all', status: 'COMPLETED', canStart: false },
    { id: 'can-retry', status: 'OPEN', canStart: true },
  ])
  assert.equal(result.statusCounts.COMPLETED, 1)
  assert.equal(result.statusCounts.OPEN, 1)
})
