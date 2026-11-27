import { Prisma } from '@prisma/client'
import prisma from '../../../lib/prisma'

export async function findSubmissionPage(scheduleId: string, courseOfferingIds: string[], page: number, pageSize: number) {
  if (!courseOfferingIds.length) return { total: 0, ids: [] as string[] }
  const makeupSchedules = await prisma.examSchedule.findMany({
    where: { makeupOfScheduleId: scheduleId },
    select: { id: true, targetStudents: { select: { studentId: true } } },
  })
  const scheduleIds = [scheduleId, ...makeupSchedules.map(schedule => schedule.id)]
  const targets = [...new Set(makeupSchedules.flatMap(schedule => schedule.targetStudents.map(target => target.studentId)))]
  const targetFilter = targets.length ? Prisma.sql`
    AND (attempt."examScheduleId" = ${scheduleId} OR attempt."studentId" IN (${Prisma.join(targets)}))
  ` : Prisma.empty
  const [result] = await prisma.$queryRaw<Array<{ total: number; ids: string[] }>>`
    WITH ranked AS (
      SELECT attempt."id", student."studentCode",
        row_number() OVER (PARTITION BY attempt."studentId" ORDER BY
          (attempt."examScheduleId" <> ${scheduleId}) DESC,
          attempt."submittedAt" DESC, attempt."createdAt" DESC, attempt."id" DESC) AS rank
      FROM "ExamAttempt" AS attempt
      JOIN "Student" AS student ON student."id" = attempt."studentId"
      WHERE attempt."examScheduleId" IN (${Prisma.join(scheduleIds)})
        AND attempt."courseOfferingId" IN (${Prisma.join(courseOfferingIds)})
        AND attempt."status" <> 'IN_PROGRESS'
        ${targetFilter}
    ), selected AS (
      SELECT "id", "studentCode" FROM ranked WHERE rank = 1
    )
    SELECT (SELECT count(*)::int FROM selected) AS total,
      ARRAY(SELECT "id" FROM selected ORDER BY "studentCode" COLLATE "C", "id"
        LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}) AS ids
  `
  return result ?? { total: 0, ids: [] }
}
