import assert from 'node:assert/strict'
import Module from 'node:module'
import { test } from 'node:test'
import { Prisma } from '@prisma/client'
import { PGlite } from '@electric-sql/pglite'

test('practice Redis lease serializes generation and quota uses existing Student row', async context => {
  const database = new PGlite()
  const redisId = require.resolve('../../../lib/redis')
  const serviceId = require.resolve('./practice-generation.lease')
  const original = require.cache[redisId]
  const entries = new Map<string, string>()
  const client = {
    set: async (key: string, token: string) => {
      if (entries.has(key)) return null
      entries.set(key, token)
      return 'OK'
    },
    get: async (key: string) => entries.get(key),
    eval: async (script: string, _keys: number, key: string, token: string) => {
      if (entries.get(key) !== token) return 0
      if (script.includes("'DEL'")) entries.delete(key)
      return 1
    },
  }
  const stub = new Module(redisId)
  stub.exports = { __esModule: true, default: client }
  require.cache[redisId] = stub
  context.after(async () => {
    if (original) require.cache[redisId] = original
    else delete require.cache[redisId]
    delete require.cache[serviceId]
    await database.close()
  })
  await database.exec(`CREATE TABLE "Student" ("id" text PRIMARY KEY); INSERT INTO "Student" VALUES ('student')`)
  const lease = await import('./practice-generation.lease')
  let recent = 9
  const tx = { $queryRaw: async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const query = Prisma.sql(strings, ...values)
    return (await database.query(query.text, query.values)).rows
  }, practiceSet: { count: async () => recent } } as unknown as Prisma.TransactionClient
  await lease.withPracticeGenerationLease('student', async token => {
    await assert.rejects(lease.withPracticeGenerationLease('student', async () => undefined), /already in progress/)
    await lease.assertPracticeGenerationLease(tx, 'student', token)
    recent = 10
    await assert.rejects(lease.assertPracticeGenerationLease(tx, 'student', token), /Daily practice/)
    await assert.rejects(lease.assertPracticeGenerationLease(tx, 'student', 'stale-token'), /ownership/)
  })
  await assert.rejects(lease.withPracticeGenerationLease('student', async () => { throw new Error('provider failed') }), /provider failed/)
  assert.equal(await lease.withPracticeGenerationLease('student', async () => 'released'), 'released')
  await lease.withPracticeGenerationLease('student', async () => {
    entries.set('soes:practice-generation:student', 'new-owner')
  })
  assert.equal(entries.get('soes:practice-generation:student'), 'new-owner')
})
