import type { Prisma } from '@prisma/client'
import prisma from '../../../lib/prisma'
import { scheduleInclude } from '../../exam-schedules/repositories/exam-schedule.repository'

export const findOwnedExam = (teacherId: string, examId: string) => prisma.exam.findFirst({
  where: { id: examId, createdById: teacherId },
  select: {
    id: true, title: true, subjectId: true, semesterId: true, type: true, status: true,
    contentHash: true,
    _count: { select: { examQuestions: true } },
  },
})

export const findAccessibleExam = (teacherId: string, examId: string) => prisma.exam.findFirst({
  where: {
    id: examId,
    OR: [
      { createdById: teacherId },
      { schedules: { some: { scheduleCourses: { some: { courseOffering: { teacherId } } } } } },
    ],
  },
  select: { id: true },
})

export const findOwnedCourse = (teacherId: string, courseOfferingId: string) => prisma.courseOffering.findFirst({
  where: { id: courseOfferingId, teacherId, status: 'ACTIVE' },
  select: { id: true, code: true, subjectId: true, semesterId: true },
})

export async function listCourseStudentUserIds(courseOfferingId: string) {
  const rows = await prisma.enrollment.findMany({
    where: { courseOfferingId },
    select: { student: { select: { userId: true } } },
  })
  return rows.map((row) => row.student.userId)
}

export async function listCourseStudentNotificationTargets(courseOfferingId: string) {
  const rows = await prisma.enrollment.findMany({
    where: { courseOfferingId },
    select: { student: { select: { userId: true } } },
  })
  return rows.map((row) => ({ userId: row.student.userId, courseOfferingId }))
}

const scheduleCourseAccess = (teacherId: string): Prisma.ExamScheduleCourseWhereInput => ({
  OR: [
    { courseOffering: { teacherId } },
    { examSchedule: { exam: { createdById: teacherId, type: { not: 'FINAL' } } } },
  ],
})

const teacherScheduleInclude = (teacherId: string) => ({
  exam: scheduleInclude.exam,
  scheduleCourses: {
    where: scheduleCourseAccess(teacherId),
    include: scheduleInclude.scheduleCourses.include,
  },
  attempts: scheduleInclude.attempts,
  targetStudents: scheduleInclude.targetStudents,
  _count: scheduleInclude._count,
}) satisfies Prisma.ExamScheduleInclude

export const listExamSchedules = (teacherId: string, examId: string) => prisma.examSchedule.findMany({
  where: {
    OR: [
      // Ca thi thuộc đề này (ca gốc)
      {
        examId,
        OR: [
          { exam: { createdById: teacherId, type: { not: 'FINAL' } } },
          { scheduleCourses: { some: { courseOffering: { teacherId } } } },
        ],
      },
      // Ca dự phòng của ca thi thuộc đề này (đề có thể khác)
      {
        makeupOfSchedule: {
          examId,
          OR: [
            { exam: { createdById: teacherId, type: { not: 'FINAL' } } },
            { scheduleCourses: { some: { courseOffering: { teacherId } } } },
          ],
        },
      },
    ],
  },
  include: teacherScheduleInclude(teacherId),
  orderBy: { startTime: 'asc' },
})

export const findOwnedSchedule = (tx: Prisma.TransactionClient, teacherId: string, userId: string, id: string) =>
  tx.examSchedule.findFirst({
    where: { id, createdById: userId, exam: { createdById: teacherId } },
    select: {
      id: true, status: true, startTime: true, endTime: true,
      exam: { select: { status: true } },
      _count: { select: { attempts: true } },
    },
  })

export const findOwnedScheduleForMakeup = (
  tx: Prisma.TransactionClient,
  teacherId: string,
  userId: string,
  examId: string,
  scheduleId: string,
) => tx.examSchedule.findFirst({
  where: {
    id: scheduleId,
    examId,
    // Chỉ ca gốc (không phải ca dự phòng) mới được tạo ca dự phòng
    makeupOfScheduleId: null,
    createdById: userId,
    exam: { createdById: teacherId },
    scheduleCourses: { some: { courseOffering: { teacherId } } },
  },
  select: {
    id: true,
    title: true,
    status: true,
    startTime: true,
    endTime: true,
    resultsPublishedAt: true,
    blockCopyPaste: true,
    blockRightClick: true,
    locationMode: true,
    allowedIpRanges: true,
    exam: { select: { id: true, title: true, status: true, subjectId: true } },
    scheduleCourses: {
      take: 1,
      select: { courseOffering: { select: { id: true, code: true, subjectId: true, semesterId: true } } },
    },
    _count: { select: { makeupSchedules: true } },
  },
})

export const listCourseStudents = (courseOfferingId: string, studentIds: string[]) => prisma.student.findMany({
  where: {
    id: { in: studentIds },
    enrollments: { some: { courseOfferingId } },
  },
  select: { id: true, userId: true },
})

/** Tìm ca dự phòng đang còn chạy (SCHEDULED hoặc OPEN) của ca gốc */
export const findActiveMakeupSchedule = (scheduleId: string) =>
  prisma.examSchedule.findFirst({
    where: {
      makeupOfScheduleId: scheduleId,
      status: { in: ['DRAFT', 'SCHEDULED', 'OPEN'] },
    },
    select: { id: true, title: true, status: true, startTime: true, endTime: true },
  })

/** Kiểm tra trạng thái ca dự phòng của một ca gốc */
export const findMakeupEligibility = async (
  teacherId: string,
  userId: string,
  examId: string,
  scheduleId: string,
) => {
  const schedule = await prisma.examSchedule.findFirst({
    where: {
      id: scheduleId,
      examId,
      // Chỉ cho tạo dự phòng từ ca gốc — không cho từ ca dự phòng
      makeupOfScheduleId: null,
      createdById: userId,
      exam: { createdById: teacherId },
      scheduleCourses: { some: { courseOffering: { teacherId } } },
    },
    select: {
      id: true,
      status: true,
      endTime: true,
      resultsPublishedAt: true,
      makeupSchedules: {
        select: { id: true, status: true, startTime: true, endTime: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })
  return schedule
}
