import prisma from '../../../lib/prisma'

export async function findScheduleById(scheduleId: string) {
  return prisma.examSchedule.findUnique({
    where: { id: scheduleId },
    select: {
      id: true,
      status: true,
      publishedAt: true,
      startTime: true,
      endTime: true,
      durationMinutes: true,
      maxAttempts: true,
      passwordHash: true,
      distributionMode: true,
      randomQuestionCount: true,
      exam: { select: { id: true, status: true } },
    },
  })
}

export async function findEnrollment(scheduleId: string, studentId: string) {
  return prisma.enrollment.findFirst({
    where: {
      studentId,
      courseOffering: { scheduleCourses: { some: { examScheduleId: scheduleId } } },
    },
    select: { id: true, courseOfferingId: true },
  })
}
