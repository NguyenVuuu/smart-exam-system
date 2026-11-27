import assert from 'node:assert/strict'
import Module from 'node:module'
import { test } from 'node:test'
import { Prisma } from '@prisma/client'
import { PGlite } from '@electric-sql/pglite'

test('schedule DB pagination preserves visibility, status precedence and total attempt counts', async context => {
  const database = new PGlite()
  const prismaId = require.resolve('../../../lib/prisma')
  const repositoryId = require.resolve('./schedule-page.repository')
  const original = require.cache[prismaId]
  context.after(async () => {
    if (original) require.cache[prismaId] = original
    else delete require.cache[prismaId]
    delete require.cache[repositoryId]
    await database.close()
  })
  await database.exec(`
    CREATE TABLE "Exam" ("id" text PRIMARY KEY, "status" text, "studentVisibility" text);
    CREATE TABLE "ExamSchedule" ("id" text PRIMARY KEY, "examId" text, "title" text, "startTime" timestamp,
      "endTime" timestamp, "createdAt" timestamp DEFAULT '2026-01-01', "maxAttempts" int DEFAULT 1,
      "publishedAt" timestamp DEFAULT '2026-01-01', "status" text DEFAULT 'SCHEDULED');
    CREATE TABLE "ExamAttempt" ("examScheduleId" text, "studentId" text, "attemptNo" int, "status" text, "deadlineAt" timestamp);
    CREATE TABLE "ExamScheduleCourse" ("examScheduleId" text, "courseOfferingId" text);
    CREATE TABLE "CourseOffering" ("id" text, "semesterId" text, "subjectId" text, "teacherId" text, "code" text);
    CREATE TABLE "Enrollment" ("courseOfferingId" text, "studentId" text);
    CREATE TABLE "Subject" ("id" text, "code" text, "name" text);
    CREATE TABLE "Teacher" ("id" text, "userId" text);
    CREATE TABLE "User" ("id" text, "fullName" text);
    INSERT INTO "Exam" VALUES ('visible','READY','VISIBLE'),('hidden','READY','HIDDEN');
    INSERT INTO "CourseOffering" VALUES ('course','term','subject','teacher','JAVA101');
    INSERT INTO "Enrollment" VALUES ('course','student');
    INSERT INTO "Subject" VALUES ('subject','JAVA','Java');
    INSERT INTO "Teacher" VALUES ('teacher','user'); INSERT INTO "User" VALUES ('user','Fixture Teacher');
    INSERT INTO "ExamSchedule" ("id","examId","title","startTime","endTime") VALUES
      ('open','visible','Open','2026-01-10','2026-01-20'),
      ('resume','visible','Resume','2026-01-10','2026-01-11'),
      ('upcoming','visible','Upcoming','2026-01-20','2026-01-25'),
      ('completed','visible','Completed','2026-01-20','2026-01-25'),
      ('expired','visible','Expired','2026-01-01','2026-01-02'),
      ('hidden','hidden','Hidden','2026-01-10','2026-01-20');
    INSERT INTO "ExamScheduleCourse" SELECT "id",'course' FROM "ExamSchedule";
    INSERT INTO "ExamAttempt" VALUES
      ('resume','student',1,'IN_PROGRESS','2026-01-16'),
      ('completed','student',1,'GRADED','2026-01-14');
  `)
  const stub = new Module(prismaId)
  stub.exports = { __esModule: true, default: { $queryRaw: async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const query = Prisma.sql(strings, ...values)
    return (await database.query(query.text, query.values)).rows
  } } }
  require.cache[prismaId] = stub
  const { findVisibleSchedulePage } = await import('./schedule-page.repository')
  const now = new Date('2026-01-15T00:00:00Z')
  const query = { page: 1, pageSize: 1, status: 'ALL' as const }
  const all = await findVisibleSchedulePage('student', query, now)
  assert.equal(all.total, 5)
  assert.deepEqual(all.statusCounts, { OPEN: 2, UPCOMING: 1, COMPLETED: 1, EXPIRED: 1 })
  const open = await findVisibleSchedulePage('student', { ...query, status: 'OPEN' }, now)
  assert.equal(open.total, 2)
  assert.deepEqual(open.ids, ['open'])
  assert.deepEqual((await findVisibleSchedulePage('student', { ...query, status: 'OPEN', page: 2 }, now)).ids, ['resume'])
  assert.equal((await findVisibleSchedulePage('student', { ...query, keyword: 'Fixture Teacher' }, now)).total, 5)
  assert.equal((await findVisibleSchedulePage('student', { ...query, semesterId: 'other' }, now)).total, 0)
  assert.equal((await findVisibleSchedulePage('another', query, now)).total, 0)
})
