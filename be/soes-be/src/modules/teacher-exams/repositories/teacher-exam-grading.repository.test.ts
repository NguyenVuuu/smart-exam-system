import assert from 'node:assert/strict'
import { test } from 'node:test'
import Module from 'node:module'
import { Prisma } from '@prisma/client'
import { PGlite } from '@electric-sql/pglite'

test('submission pagination hydrates only the selected page and preserves makeup priority', async context => {
  const database = new PGlite()
  await database.exec(`CREATE TABLE "Student" ("id" text PRIMARY KEY, "studentCode" text);
    CREATE TABLE "ExamAttempt" ("id" text PRIMARY KEY, "studentId" text, "examScheduleId" text,
      "courseOfferingId" text, "status" text, "submittedAt" timestamp, "createdAt" timestamp);
    INSERT INTO "Student" VALUES ('a','US001'), ('b','US002'), ('x','US000');
    INSERT INTO "ExamAttempt" VALUES
      ('phantom','x','makeup','course','SUBMITTED','2026-01-03','2026-01-03'),
      ('original-b','b','original','course','SUBMITTED','2026-01-03','2026-01-03'),
      ('original-a','a','original','course','SUBMITTED','2026-01-03','2026-01-03'),
      ('makeup-a','a','makeup','course','SUBMITTED','2026-01-02','2026-01-02');`)
  const row = (id: string, studentId: string, code: string, isMakeup = false) => ({
    id, studentId, student: { studentCode: code },
    examSchedule: { makeupOfScheduleId: isMakeup ? 'original' : null },
  })
  const candidates = [row('phantom', 'x', 'US000', true), row('original-b', 'b', 'US002'),
    row('original-a', 'a', 'US001'), row('makeup-a', 'a', 'US001', true)]
  const hydrated: string[][] = []
  const findMany = async (query: {
    select?: unknown; include?: unknown; where: { id?: { in: string[] } };
  }) => {
    assert.equal(query.select, undefined)
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
    $queryRaw: async (strings: TemplateStringsArray, ...values: unknown[]) => {
      const sql = Prisma.sql(strings, ...values)
      return (await database.query(sql.text, sql.values)).rows
    },
  } }
  require.cache[prismaId] = stub
  context.after(async () => {
    if (original) require.cache[prismaId] = original
    else delete require.cache[prismaId]
    delete require.cache[repositoryId]
    delete require.cache[require.resolve('./submission-page.repository')]
    await database.close()
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
