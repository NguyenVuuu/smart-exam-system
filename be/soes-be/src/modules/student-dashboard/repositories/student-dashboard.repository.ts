import prisma from '../../../lib/prisma'

const releasedResultWhere = {
  OR: [
    { examSchedule: { resultReleaseMode: 'IMMEDIATE' as const } },
    { examSchedule: { resultsPublishedAt: { not: null } } },
  ],
}

export async function findStudentById(studentId: string) {
  return prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, user: { select: { fullName: true } } },
  })
}

export async function findEnrollmentsWithSchedules(studentId: string) {
  return prisma.enrollment.findMany({
    where: { studentId },
    select: {
      courseOffering: {
        select: {
          id: true,
          subject: { select: { id: true, name: true } },
          semester: { select: { id: true, name: true } },
          scheduleCourses: {
            select: {
              examSchedule: {
                select: {
                  id: true,
                  title: true,
                  startTime: true,
                  endTime: true,
                  durationMinutes: true,
                  status: true,
                  publishedAt: true,
                  exam: { select: { type: true } },
                },
              },
            },
          },
        },
      },
    },
  })
}

export async function findReleasedAttempts(studentId: string) {
  return prisma.examAttempt.findMany({
    where: {
      studentId,
      status: { in: ['SUBMITTED', 'GRADING', 'GRADED', 'PUBLISHED'] },
      totalScore: { not: null },
      ...releasedResultWhere,
    },
    select: {
      totalScore: true,
      examScheduleId: true,
      examSchedule: {
        select: {
          exam: {
            select: {
              id: true,
              type: true,
              examQuestions: { select: { points: true } },
            },
          },
        },
      },
      courseOffering: {
        select: {
          subject: { select: { id: true, name: true } },
          semester: { select: { id: true, name: true } },
        },
      },
    },
  })
}

export async function findClassAveragesBySchedule(
  scheduleIds: string[],
): Promise<Map<string, number>> {
  if (scheduleIds.length === 0) return new Map()

  const attempts = await prisma.examAttempt.findMany({
    where: {
      examScheduleId: { in: scheduleIds },
      status: { in: ['SUBMITTED', 'GRADING', 'GRADED', 'PUBLISHED'] },
      totalScore: { not: null },
      ...releasedResultWhere,
    },
    select: {
      examScheduleId: true,
      totalScore: true,
      examSchedule: {
        select: {
          exam: { select: { examQuestions: { select: { points: true } } } },
        },
      },
    },
  })

  const scoresBySchedule = new Map<string, number[]>()
  for (const attempt of attempts) {
    const totalPoints = attempt.examSchedule.exam.examQuestions.reduce(
      (total, question) => total + Number(question.points),
      0,
    )
    if (totalPoints === 0) continue
    const scores = scoresBySchedule.get(attempt.examScheduleId) ?? []
    scores.push((Number(attempt.totalScore) / totalPoints) * 10)
    scoresBySchedule.set(attempt.examScheduleId, scores)
  }

  return new Map(
    [...scoresBySchedule].map(([scheduleId, scores]) => [
      scheduleId,
      scores.reduce((total, score) => total + score, 0) / scores.length,
    ]),
  )
}

export async function findNotifications(userId: string, limit = 10) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      title: true,
      content: true,
      isRead: true,
      createdAt: true,
    },
  })
}
