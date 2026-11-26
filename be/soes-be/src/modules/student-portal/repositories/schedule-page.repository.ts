import { Prisma } from '@prisma/client'
import prisma from '../../../lib/prisma'
import { STUDENT_VISIBLE_EXAM_STATUSES, STUDENT_VISIBLE_SCHEDULE_STATUSES } from '../../student-common/exam-visibility.policy'
import type { StudentExamSchedulesQuery } from '../validators/student-portal.validator'

interface SchedulePage {
  ids: string[]
  total: number
  statusCounts: Record<'OPEN' | 'UPCOMING' | 'COMPLETED' | 'EXPIRED', number>
}

export async function findVisibleSchedulePage(studentId: string, query: StudentExamSchedulesQuery, now: Date) {
  const keyword = query.keyword
  const keywordFilter = keyword ? Prisma.sql`AND (schedule."title" ILIKE ${`%${keyword}%`} OR EXISTS (
    SELECT 1 FROM "ExamScheduleCourse" link JOIN "CourseOffering" course ON course."id" = link."courseOfferingId"
    JOIN "Subject" subject ON subject."id" = course."subjectId"
    JOIN "Teacher" teacher ON teacher."id" = course."teacherId" JOIN "User" account ON account."id" = teacher."userId"
    WHERE link."examScheduleId" = schedule."id" AND (course."code" ILIKE ${`%${keyword}%`}
      OR subject."name" ILIKE ${`%${keyword}%`} OR subject."code" ILIKE ${`%${keyword}%`}
      OR account."fullName" ILIKE ${`%${keyword}%`})
  ))` : Prisma.empty
  const [result] = await prisma.$queryRaw<SchedulePage[]>`
    WITH classified AS (
      SELECT schedule."id", schedule."startTime", schedule."createdAt", CASE
        WHEN latest."status" IN ('SUBMITTED','GRADING','GRADED','PUBLISHED','AUTO_SUBMITTED','INVALIDATED') THEN 'COMPLETED'
        WHEN latest."status" = 'IN_PROGRESS' AND ${now} < latest."deadlineAt" THEN 'OPEN'
        WHEN ${now} < schedule."startTime" THEN 'UPCOMING'
        WHEN ${now} >= schedule."endTime" THEN 'EXPIRED'
        WHEN schedule."maxAttempts" > COALESCE(latest.used, 0) OR latest."status" = 'IN_PROGRESS' THEN 'OPEN'
        ELSE 'COMPLETED' END AS status
      FROM "ExamSchedule" schedule JOIN "Exam" exam ON exam."id" = schedule."examId"
      LEFT JOIN LATERAL (
        SELECT attempt."status", attempt."deadlineAt", count(*) OVER () AS used
        FROM "ExamAttempt" attempt WHERE attempt."examScheduleId" = schedule."id" AND attempt."studentId" = ${studentId}
        ORDER BY attempt."attemptNo" DESC LIMIT 1
      ) latest ON true
      WHERE schedule."publishedAt" IS NOT NULL
        AND schedule."status"::text IN (${Prisma.join(STUDENT_VISIBLE_SCHEDULE_STATUSES)})
        AND exam."status"::text IN (${Prisma.join(STUDENT_VISIBLE_EXAM_STATUSES)}) AND exam."studentVisibility" = 'VISIBLE'
        AND EXISTS (SELECT 1 FROM "ExamScheduleCourse" link
          JOIN "CourseOffering" course ON course."id" = link."courseOfferingId"
          JOIN "Enrollment" enrollment ON enrollment."courseOfferingId" = course."id"
          WHERE link."examScheduleId" = schedule."id" AND enrollment."studentId" = ${studentId}
            ${query.semesterId ? Prisma.sql`AND course."semesterId" = ${query.semesterId}` : Prisma.empty})
        ${keywordFilter}
    )
    SELECT count(*) FILTER (WHERE ${query.status} = 'ALL' OR status = ${query.status})::int AS total,
      jsonb_build_object('OPEN', count(*) FILTER (WHERE status = 'OPEN'),
        'UPCOMING', count(*) FILTER (WHERE status = 'UPCOMING'),
        'COMPLETED', count(*) FILTER (WHERE status = 'COMPLETED'),
        'EXPIRED', count(*) FILTER (WHERE status = 'EXPIRED')) AS "statusCounts",
      ARRAY(SELECT "id" FROM classified WHERE ${query.status} = 'ALL' OR status = ${query.status}
        ORDER BY "startTime", "createdAt", "id" LIMIT ${query.pageSize}
        OFFSET ${(query.page - 1) * query.pageSize}) AS ids
    FROM classified
  `
  return result ?? { ids: [], total: 0, statusCounts: { OPEN: 0, UPCOMING: 0, COMPLETED: 0, EXPIRED: 0 } }
}
