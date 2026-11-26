import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import Module from 'node:module'
import { test } from 'node:test'
import { Prisma } from '@prisma/client'
import { PGlite } from '@electric-sql/pglite'

test('grading SQL recovers expired owners and fences stale writes without backfilling manual grades', async context => {
  const database = new PGlite()
  const prismaId = require.resolve('../../../lib/prisma')
  const repositoryId = require.resolve('./grading-job.repository')
  const original = require.cache[prismaId]
  context.after(async () => {
    if (original) require.cache[prismaId] = original
    else delete require.cache[prismaId]
    delete require.cache[repositoryId]
    await database.close()
  })
  await database.exec(`CREATE TABLE "ExamAttempt" (
    "id" text PRIMARY KEY, "status" text, "endedBy" text, "submittedAt" timestamp,
    "autoScore" numeric, "totalScore" numeric, "manualScore" numeric
  ); INSERT INTO "ExamAttempt" VALUES
    ('pending','SUBMITTED','STUDENT',CURRENT_TIMESTAMP,NULL,NULL,NULL),
    ('forced','GRADING','PROCTOR',CURRENT_TIMESTAMP,NULL,NULL,NULL),
    ('manual','PUBLISHED','PROCTOR',CURRENT_TIMESTAMP,7,7,7);`)
  const migration = await readFile('prisma/migrations/20261127010000_attempt_grading_recovery/migration.sql', 'utf8')
  assert.doesNotMatch(migration, /CREATE\s+TABLE/i)
  await database.exec(migration)
  const query = async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const sql = Prisma.sql(strings, ...values)
    return (await database.query(sql.text, sql.values)).rows
  }
  const client = { $queryRaw: query, $executeRaw: query }
  const stub = new Module(prismaId)
  stub.exports = { __esModule: true, default: client }
  require.cache[prismaId] = stub
  const jobs = await import('./grading-job.repository')
  await jobs.assertGradingStorageReady()
  const tx = client as unknown as Prisma.TransactionClient
  const first = await jobs.claimGradingJob()
  assert.ok(first)
  const other = await jobs.claimGradingJob()
  assert.ok(other)
  assert.notEqual(first.id, other.id)
  assert.equal(await jobs.claimGradingJob(), null)
  await database.query(`UPDATE "ExamAttempt" SET "gradingLeaseUntil" = '2000-01-01' WHERE "id" = $1`, [first.id])
  const replacement = await jobs.claimGradingJob()
  assert.ok(replacement)
  assert.notEqual(replacement.gradingClaimToken, first.gradingClaimToken)
  await assert.rejects(jobs.assertGradingClaim(tx, first.id, first.gradingClaimToken))
  await jobs.failGradingClaim(first)
  await jobs.assertGradingClaim(tx, replacement.id, replacement.gradingClaimToken)
  await jobs.failGradingClaim(replacement)
  await database.query(`UPDATE "ExamAttempt" SET "gradingRetryAt" = '2000-01-01', "gradingFailures" = 5 WHERE "id" = $1`, [first.id])
  assert.equal(await jobs.claimGradingJob(), null)
  const manual = await database.query<{ gradingPending: boolean; totalScore: string }>(
    `SELECT "gradingPending", "totalScore" FROM "ExamAttempt" WHERE "id" = 'manual'`)
  assert.equal(manual.rows[0].gradingPending, false)
  assert.equal(Number(manual.rows[0].totalScore), 7)
  await database.query(`UPDATE "ExamAttempt" SET "status" = 'PUBLISHED', "manualScore" = 8 WHERE "id" = $1`, [other.id])
  await assert.rejects(jobs.assertGradingClaim(tx, other.id, other.gradingClaimToken))
})
