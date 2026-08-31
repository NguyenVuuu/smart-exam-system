import type { Prisma } from '@prisma/client'
import prisma from '../../../lib/prisma'
import { scheduleInclude } from '../../exam-schedules/repositories/exam-schedule.repository'

export const findOwnedExam = (teacherId: string, examId: string) => prisma.exam.findFirst({
  where: { id: examId, createdById: teacherId },
  select: {
    id: true, title: true, subjectId: true, semesterId: true, type: true, status: true,
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
  _count: scheduleInclude._count,
}) satisfies Prisma.ExamScheduleInclude

export const listExamSchedules = (teacherId: string, examId: string) => prisma.examSchedule.findMany({
  where: {
    examId,
    OR: [
      { exam: { createdById: teacherId, type: { not: 'FINAL' } } },
      { scheduleCourses: { some: { courseOffering: { teacherId } } } },
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
      _count: { select: { attempts: true } },
    },
  })
