import assert from 'node:assert/strict'
import Module from 'node:module'
import { test } from 'node:test'
import { Prisma } from '@prisma/client'
import { PGlite } from '@electric-sql/pglite'
import { calculateAverageScore } from '../services/score-summary'
import { studentScoresQuerySchema } from '../validators/student-portal.validator'

test('score pages enforce release/scope and prefer makeup while summaries span all pages', async context => {
  const database = new PGlite()
  const prismaId = require.resolve('../../../lib/prisma')
  const repositoryId = require.resolve('./score-page.repository')
  const original = require.cache[prismaId]
  context.after(async () => {
    if (original) require.cache[prismaId] = original
    else delete require.cache[prismaId]
    delete require.cache[repositoryId]
    await database.close()
  })
  await database.exec(`
    CREATE TABLE "Exam" ("id" text PRIMARY KEY, "type" text);
    CREATE TABLE "Subject" ("id" text PRIMARY KEY, "code" text, "name" text);
    CREATE TABLE "CourseOffering" ("id" text PRIMARY KEY, "subjectId" text, "code" text, "semesterId" text);
    CREATE TABLE "ExamSchedule" ("id" text PRIMARY KEY, "examId" text, "title" text,
      "makeupOfScheduleId" text, "resultReleaseMode" text, "resultsPublishedAt" timestamp, "publishedAt" timestamp);
    CREATE TABLE "ExamAttempt" ("id" text PRIMARY KEY, "examScheduleId" text, "studentId" text,
      "courseOfferingId" text, "status" text, "totalScore" numeric, "submittedAt" timestamp, "createdAt" timestamp);
    INSERT INTO "Exam" VALUES ('final','FINAL'),('quiz','QUIZ');
    INSERT INTO "Subject" VALUES ('java','JAVA','Java');
    INSERT INTO "CourseOffering" VALUES ('course','java','JAVA101','semester');
    INSERT INTO "ExamSchedule" VALUES
      ('original','final','Final',NULL,'MANUAL','2026-01-01','2026-01-01'),
      ('makeup','final','Makeup','original','MANUAL',NULL,'2026-01-01'),
      ('quiz','quiz','Quiz',NULL,'IMMEDIATE',NULL,'2026-01-01'),
      ('hidden','final','Hidden',NULL,'MANUAL',NULL,'2026-01-01');
    INSERT INTO "ExamAttempt" VALUES
      ('original','original','student','course','PUBLISHED',4,'2026-02-01','2026-01-01'),
      ('makeup','makeup','student','course','PUBLISHED',8,'2026-01-01','2026-01-01'),
      ('quiz','quiz','student','course','PUBLISHED',6,'2026-01-15','2026-01-01'),
      ('hidden','hidden','student','course','PUBLISHED',10,'2026-03-01','2026-01-01'),
      ('graded','quiz','student','course','GRADED',10,'2026-03-01','2026-01-01'),
      ('other','quiz','another','course','PUBLISHED',10,'2026-03-01','2026-01-01');
  `)
  const stub = new Module(prismaId)
  stub.exports = { __esModule: true, default: { $queryRaw: async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const query = Prisma.sql(strings, ...values)
    return (await database.query(query.text, query.values)).rows
  } } }
  require.cache[prismaId] = stub
  const { findReleasedScorePage } = await import('./score-page.repository')
  const first = await findReleasedScorePage('student', { page: 1, pageSize: 1 })
  const second = await findReleasedScorePage('student', { page: 2, pageSize: 1 })
  assert.deepEqual(first.ids, ['makeup'])
  assert.deepEqual(second.ids, ['quiz'])
  assert.equal(first.total, 2)
  assert.equal(first.highestScore, 8)
  assert.equal(calculateAverageScore(first.summary), 7.5)
  assert.deepEqual(second.summary, first.summary)
  assert.equal((await findReleasedScorePage('student', { semesterId: 'other' })).total, 0)
  assert.equal((await findReleasedScorePage('student', { courseOfferingId: 'other' })).total, 0)
  assert.deepEqual((await findReleasedScorePage('student', { keyword: 'Quiz' })).ids, ['quiz'])
  assert.equal((await findReleasedScorePage('student', { page: 10, pageSize: 1 })).ids.length, 0)
  assert.equal(studentScoresQuerySchema.safeParse({ pageSize: 1000 }).success, false)
  assert.equal(studentScoresQuerySchema.parse({}).page, undefined)
})

test('score average preserves three-quiz limit and averages courses equally', () => {
  const scores = [1, 2, 3, 10].map((score, index) => ({ score, courseOfferingId: 'one', type: 'QUIZ',
    publishedAt: `2026-01-0${index + 1}`, title: `Quiz ${index}` }))
  scores.push({ score: 10, courseOfferingId: 'two', type: 'FINAL', publishedAt: '2026-01-01', title: 'Final' })
  assert.equal(calculateAverageScore(scores), 6)
  assert.equal(calculateAverageScore([]), null)
})
