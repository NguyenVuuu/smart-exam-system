import type { Prisma } from '@prisma/client'
import prisma from '../../../lib/prisma'
import { scheduleInclude } from '../../exam-schedules/repositories/exam-schedule.repository'

export const findOwnedExam = (teacherId: string, examId: string) => prisma.exam.findFirst({
  where: { id: examId, createdById: teacherId },
  select: {
    id: true, title: true, subjectId: true, type: true, status: true,
    _count: { select: { examQuestions: true } },
  },
})

export const findOwnedCourse = (teacherId: string, courseOfferingId: string) => prisma.courseOffering.findFirst({
  where: { id: courseOfferingId, teacherId, status: 'ACTIVE' },
  select: { id: true, subjectId: true },
})

export const listExamSchedules = (teacherId: string, examId: string) => prisma.examSchedule.findMany({
  where: { examId, exam: { createdById: teacherId } }, include: scheduleInclude,
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
