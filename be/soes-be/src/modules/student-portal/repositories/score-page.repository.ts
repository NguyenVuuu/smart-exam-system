import { Prisma } from '@prisma/client'
import prisma from '../../../lib/prisma'
import type { StudentScoresQuery } from '../validators/student-portal.validator'

export interface ScorePage {
  ids: string[]
  total: number
  highestScore: number | null
  summary: Array<{ courseOfferingId: string; score: number; type: string; publishedAt: string | null; title: string }>
}

export async function findReleasedScorePage(studentId: string, query: StudentScoresQuery) {
  const keyword = query.keyword?.trim()
  const labels = { MIDTERM: 'giữa kỳ', FINAL: 'cuối kỳ', QUIZ: 'quiz' }
  const types = keyword ? Object.entries(labels).filter(([, label]) => label.includes(keyword.toLocaleLowerCase('vi'))).map(([type]) => type) : []
  const filter = keyword ? Prisma.sql`AND (
    schedule."title" ILIKE ${`%${keyword}%`} OR course."code" ILIKE ${`%${keyword}%`}
    OR subject."name" ILIKE ${`%${keyword}%`} OR subject."code" ILIKE ${`%${keyword}%`}
    ${types.length ? Prisma.sql`OR exam."type"::text IN (${Prisma.join(types)})` : Prisma.empty}
  )` : Prisma.empty
  const [result] = await prisma.$queryRaw<ScorePage[]>`
    WITH eligible AS (
      SELECT attempt."id", attempt."totalScore" AS score, course."id" AS "courseOfferingId",
        schedule."title", exam."type", COALESCE(schedule."resultsPublishedAt", schedule."publishedAt") AS "publishedAt",
        row_number() OVER (ORDER BY attempt."submittedAt" DESC, attempt."createdAt" DESC, attempt."id" DESC) AS position,
        COALESCE(schedule."makeupOfScheduleId", schedule."id") AS original,
        row_number() OVER (PARTITION BY COALESCE(schedule."makeupOfScheduleId", schedule."id") ORDER BY
          (schedule."makeupOfScheduleId" IS NOT NULL) DESC,
          attempt."submittedAt" DESC, attempt."createdAt" DESC, attempt."id" DESC) AS rank
      FROM "ExamAttempt" attempt
      JOIN "ExamSchedule" schedule ON schedule."id" = attempt."examScheduleId"
      LEFT JOIN "ExamSchedule" parent ON parent."id" = schedule."makeupOfScheduleId"
      JOIN "CourseOffering" course ON course."id" = attempt."courseOfferingId"
      JOIN "Subject" subject ON subject."id" = course."subjectId"
      JOIN "Exam" exam ON exam."id" = schedule."examId"
      WHERE attempt."studentId" = ${studentId} AND attempt."status" = 'PUBLISHED' AND attempt."totalScore" IS NOT NULL
        ${query.courseOfferingId ? Prisma.sql`AND course."id" = ${query.courseOfferingId}` : Prisma.empty}
        ${query.semesterId ? Prisma.sql`AND course."semesterId" = ${query.semesterId}` : Prisma.empty}
        AND (schedule."resultReleaseMode" = 'IMMEDIATE'
          OR (schedule."resultReleaseMode" = 'MANUAL' AND schedule."resultsPublishedAt" IS NOT NULL)
          OR parent."resultReleaseMode" = 'IMMEDIATE'
          OR (parent."resultReleaseMode" = 'MANUAL' AND parent."resultsPublishedAt" IS NOT NULL))
        ${filter}
    ), ranked AS (
      SELECT *, min(position) OVER (PARTITION BY original) AS "groupPosition" FROM eligible
    ), selected AS (SELECT * FROM ranked WHERE rank = 1)
    SELECT count(*)::int AS total, max(score)::float8 AS "highestScore",
      ARRAY(SELECT "id" FROM selected ORDER BY "groupPosition" LIMIT ${query.pageSize ?? 20}
        OFFSET ${((query.page ?? 1) - 1) * (query.pageSize ?? 20)}) AS ids,
      COALESCE(jsonb_agg(jsonb_build_object('courseOfferingId', "courseOfferingId", 'score', score,
        'type', "type", 'publishedAt', to_char("publishedAt", 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'title', "title") ORDER BY "groupPosition"), '[]') AS summary
    FROM selected
  `
  return result ?? { ids: [], total: 0, highestScore: null, summary: [] }
}
