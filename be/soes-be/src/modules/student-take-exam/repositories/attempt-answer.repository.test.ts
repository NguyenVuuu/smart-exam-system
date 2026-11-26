import assert from 'node:assert/strict'
import { test } from 'node:test'
import prisma from '../../../lib/prisma'
import { ConflictError } from '../../../errors/AppError'
import { saveAnswer } from './attempt-answer.repository'

test('saving checks status and deadline under the attempt lock before mutating answers', async (context) => {
  const operations: string[] = []
  let status = 'SUBMITTED'
  let deadlineAt = new Date(Date.now() + 60_000)
  context.mock.method(prisma, '$transaction', async (transaction: (tx: typeof client) => Promise<void>) => transaction(client))
  const client = {
    $queryRaw: async (query: TemplateStringsArray, id: string) => {
      assert.match(query.join('?'), /WHERE "id" = \? FOR UPDATE/)
      assert.equal(id, 'attempt')
      operations.push('lock')
      return [{ status, deadlineAt }]
    },
    studentAnswer: { upsert: async () => { operations.push('answer') } },
    examAttempt: { update: async () => { operations.push('version') } },
  }
  const save = () => saveAnswer('attempt', 'question', ['option'], null)

  await assert.rejects(save(), ConflictError)
  status = 'IN_PROGRESS'
  deadlineAt = new Date(0)
  await assert.rejects(save(), ConflictError)
  assert.deepEqual(operations, ['lock', 'lock'])

  deadlineAt = new Date(Date.now() + 60_000)
  await save()
  assert.deepEqual(operations, ['lock', 'lock', 'lock', 'answer', 'version'])
})
