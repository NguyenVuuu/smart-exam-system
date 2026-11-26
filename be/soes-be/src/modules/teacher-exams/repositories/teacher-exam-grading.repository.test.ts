import assert from 'node:assert/strict'
import { test } from 'node:test'
import Module from 'node:module'

test('submission pagination hydrates only the selected page and preserves makeup priority', async context => {
  const row = (id: string, studentId: string, code: string, isMakeup = false) => ({
    id, studentId, student: { studentCode: code },
    examSchedule: { makeupOfScheduleId: isMakeup ? 'original' : null },
  })
  const candidates = [row('phantom', 'x', '000', true), row('original-b', 'b', '002'),
    row('original-a', 'a', '001'), row('makeup-a', 'a', '001', true)]
  const hydrated: string[][] = []
  const findMany = async (query: {
    select?: unknown; include?: unknown; where: { id?: { in: string[] } };
  }) => {
    if (query.select) {
      assert.equal(query.include, undefined)
      return candidates
    }
    assert.ok(query.include)
    const ids = query.where.id?.in ?? []
    hydrated.push(ids)
    return candidates.filter(candidate => ids.includes(candidate.id)).reverse()
  }
  const prismaId = require.resolve('../../../lib/prisma')
  const repositoryId = require.resolve('./teacher-exam-grading.repository')
  const original = require.cache[prismaId]
  const stub = new Module(prismaId)
  stub.exports = { __esModule: true, default: {
    examSchedule: {
      findUnique: async () => null,
      findMany: async () => [{ id: 'makeup', targetStudents: [{ studentId: 'a' }] }],
    },
    examAttempt: { findMany },
  } }
  require.cache[prismaId] = stub
  context.after(() => {
    if (original) require.cache[prismaId] = original
    else delete require.cache[prismaId]
    delete require.cache[repositoryId]
  })
  const { listSubmissions } = await import('./teacher-exam-grading.repository')

  const [total, first] = await listSubmissions('original', ['course'], 1, 1)
  assert.equal(total, 2)
  assert.deepEqual(first.map(item => item.id), ['makeup-a'])
  const [, second] = await listSubmissions('original', ['course'], 2, 1)
  assert.deepEqual(second.map(item => item.id), ['original-b'])
  const [, empty] = await listSubmissions('original', ['course'], 3, 1)
  assert.deepEqual(empty, [])
  assert.deepEqual(hydrated, [['makeup-a'], ['original-b']])
})
