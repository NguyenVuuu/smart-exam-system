import type { Prisma } from '@prisma/client'
import prisma from '../../../lib/prisma'

export const submissionInclude = {
  student: { include: { user: { select: { fullName: true } } } },
  examSchedule: {
    select: {
      examId: true,
      exam: { select: { sections: { orderBy: { orderIndex: 'asc' as const } } } },
    },
  },
  studentAnswers: {
    include: { examQuestion: { include: { section: true } } },
    orderBy: { examQuestion: { orderIndex: 'asc' as const } },
  },
  programmingSubmissions: {
    include: { testResults: { include: { testCase: true } } },
    orderBy: { submissionNo: 'desc' as const },
  },
}

const scheduleCourseAccess = (teacherId: string): Prisma.ExamScheduleCourseWhereInput => ({
  OR: [
    { courseOffering: { teacherId } },
    { examSchedule: { exam: { createdById: teacherId, type: { not: 'FINAL' } } } },
  ],
})

const violationScheduleCourseAccess = (teacherId: string): Prisma.ExamScheduleCourseWhereInput => ({
  OR: [
    { courseOffering: { teacherId } },
    { proctors: { some: { teacherId } } },
    { examSchedule: { exam: { createdById: teacherId, type: { not: 'FINAL' } } } },
  ],
})

const gradingAccess = (teacherId: string): Prisma.ExamScheduleWhereInput => ({
  scheduleCourses: { some: scheduleCourseAccess(teacherId) },
})

const violationAccess = (teacherId: string): Prisma.ExamScheduleWhereInput => ({
  scheduleCourses: { some: violationScheduleCourseAccess(teacherId) },
})

export const findScheduleAccess = (teacherId: string, examId: string, scheduleId: string) =>
  prisma.examSchedule.findFirst({
    where: { id: scheduleId, examId, ...gradingAccess(teacherId) },
    select: {
      id: true, status: true, startTime: true, endTime: true,
      resultReleaseMode: true, resultReleaseAt: true, resultsPublishedAt: true,
      exam: { select: { totalPoints: true } },
      scheduleCourses: {
        where: scheduleCourseAccess(teacherId),
        select: { courseOfferingId: true },
      },
    },
  })

export const findViolationScheduleAccess = (teacherId: string, examId: string, scheduleId: string) =>
  prisma.examSchedule.findFirst({
    where: { id: scheduleId, examId, ...violationAccess(teacherId) },
    select: {
      id: true,
      scheduleCourses: {
        where: violationScheduleCourseAccess(teacherId),
        select: { courseOfferingId: true },
      },
    },
  })

export function listSubmissions(scheduleId: string, courseOfferingIds: string[], page: number, pageSize: number) {
  const where: Prisma.ExamAttemptWhereInput = {
    examScheduleId: scheduleId,
    courseOfferingId: { in: courseOfferingIds },
    status: { not: 'IN_PROGRESS' },
  }
  return Promise.all([
    prisma.examAttempt.count({ where }),
    prisma.examAttempt.findMany({
      where, include: submissionInclude,
      skip: (page - 1) * pageSize, take: pageSize,
      orderBy: [{ submittedAt: 'desc' }, { createdAt: 'desc' }],
    }),
  ])
}

export function listViolations(scheduleId: string, courseOfferingIds: string[], page: number, pageSize: number) {
  const where: Prisma.ViolationWhereInput = {
    attempt: { examScheduleId: scheduleId, courseOfferingId: { in: courseOfferingIds } },
  }
  return Promise.all([
    prisma.violation.count({ where }),
    prisma.violation.findMany({
      where,
      include: { attempt: { include: { student: { include: { user: { select: { fullName: true } } } } } } },
      skip: (page - 1) * pageSize, take: pageSize,
      orderBy: { detectedAt: 'desc' },
    }),
  ])
}

export function overrideScore(
  teacherId: string,
  userId: string,
  examId: string,
  scheduleId: string,
  attemptId: string,
  score: number,
  reason: string,
) {
  return prisma.$transaction(async (tx) => {
    const attempt = await tx.examAttempt.findFirst({
      where: {
        id: attemptId, examScheduleId: scheduleId,
        examSchedule: { examId, ...gradingAccess(teacherId) },
        courseOffering: {
          OR: [
            { teacherId },
          ],
        },
        status: { in: ['SUBMITTED', 'AUTO_SUBMITTED', 'GRADING', 'GRADED', 'PUBLISHED'] },
      },
      select: { id: true, totalScore: true },
    })
    if (!attempt) return null
    const updated = await tx.examAttempt.update({
      where: { id: attemptId },
      data: { manualScore: score, totalScore: score, status: 'GRADED', version: { increment: 1 } },
      include: submissionInclude,
    })
    await tx.auditLog.create({
      data: {
        userId, action: 'OVERRIDE_EXAM_SCORE', entityType: 'ExamAttempt', entityId: attemptId,
        metadata: { reason, previousScore: attempt.totalScore, newScore: score },
      },
    })
    return updated
  })
}

export function updateResultRelease(
  teacherId: string,
  examId: string,
  scheduleId: string,
  data: { mode: 'IMMEDIATE' | 'MANUAL' | 'SCHEDULED'; releaseAt?: Date | null; published: boolean },
) {
  return prisma.$transaction(async (tx) => {
    const schedule = await tx.examSchedule.findFirst({
      where: { id: scheduleId, examId, ...gradingAccess(teacherId) }, select: { id: true },
    })
    if (!schedule) return null
    const resultsPublishedAt = data.published || data.mode === 'IMMEDIATE' ? new Date() : null
    await tx.examSchedule.update({
      where: { id: scheduleId },
      data: {
        resultReleaseMode: data.mode, resultReleaseAt: data.mode === 'SCHEDULED' ? data.releaseAt : null,
        resultsPublishedAt,
      },
    })
    await tx.examAttempt.updateMany({
      where: { examScheduleId: scheduleId, status: resultsPublishedAt ? 'GRADED' : 'PUBLISHED' },
      data: { status: resultsPublishedAt ? 'PUBLISHED' : 'GRADED' },
    })
    return tx.examSchedule.findUniqueOrThrow({
      where: { id: scheduleId },
      select: { id: true, resultReleaseMode: true, resultReleaseAt: true, resultsPublishedAt: true },
    })
  })
}
