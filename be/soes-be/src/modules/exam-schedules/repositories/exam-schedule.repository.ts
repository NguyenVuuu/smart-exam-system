import type { Prisma } from '@prisma/client'
import prisma from '../../../lib/prisma'
import type { ScheduleWriteInput } from '../types/exam-schedule.types'
import type { SchedulesQuery } from '../validators/exam-schedule.validator'

export const PROCTOR_TURNOVER_MINUTES = 5

export const scheduleInclude = {
  exam: { select: { id: true, title: true, type: true, subject: { select: { id: true, code: true, name: true, departmentId: true } } } },
  scheduleCourses: {
    include: {
      courseOffering: { select: { id: true, code: true, semesterId: true } },
      proctors: { include: { teacher: { select: { id: true, teacherCode: true, user: { select: { fullName: true } } } } } },
    },
  },
  attempts: { select: { studentId: true, status: true } },
  _count: { select: { attempts: true } },
}

function effectiveStatusWhere(status: SchedulesQuery['status']): Prisma.ExamScheduleWhereInput {
  if (!status) return {}
  if (status === 'DRAFT' || status === 'CANCELLED') return { status }
  const now = new Date()
  const active: Prisma.ExamScheduleWhereInput['status'] = { notIn: ['DRAFT', 'CANCELLED'] }
  if (status === 'SCHEDULED') return { status: active, startTime: { gt: now } }
  if (status === 'OPEN') return { status: active, startTime: { lte: now }, endTime: { gt: now } }
  return { status: active, endTime: { lte: now } }
}

export function listSchedules(query: SchedulesQuery) {
  const where: Prisma.ExamScheduleWhereInput = {
    ...effectiveStatusWhere(query.status),
    ...(query.subjectId && { exam: { subjectId: query.subjectId } }),
    ...(query.departmentId && { exam: { subject: { departmentId: query.departmentId } } }),
    ...(query.semesterId && { scheduleCourses: { some: { courseOffering: { semesterId: query.semesterId } } } }),
    ...(query.keyword && { OR: [
      { title: { contains: query.keyword, mode: 'insensitive' } },
      { exam: { title: { contains: query.keyword, mode: 'insensitive' } } },
    ] }),
  }
  return Promise.all([
    prisma.examSchedule.count({ where }),
    prisma.examSchedule.findMany({
      where, include: scheduleInclude,
      skip: (query.page - 1) * query.pageSize, take: query.pageSize,
      orderBy: { startTime: 'desc' },
    }),
  ])
}

export const findSchedule = (id: string) => prisma.examSchedule.findUnique({ where: { id }, include: scheduleInclude })

export const findScheduleInTransaction = (tx: Prisma.TransactionClient, id: string) => tx.examSchedule.findUnique({
  where: { id }, select: {
    id: true, status: true, examId: true, startTime: true, endTime: true,
    _count: { select: { attempts: true } },
  },
})

export function findCreationContext(tx: Prisma.TransactionClient, examId: string, courseOfferingIds: string[], teacherIds: string[]) {
  return Promise.all([
    tx.exam.findUnique({
      where: { id: examId },
      select: { id: true, subjectId: true, semesterId: true, type: true, status: true, approvalStatus: true, examQuestions: { select: { id: true } } },
    }),
    tx.courseOffering.findMany({
      where: { id: { in: courseOfferingIds } },
      select: { id: true, subjectId: true, semesterId: true, status: true },
    }),
    tx.teacher.findMany({
      where: { id: { in: teacherIds }, status: 'ACTIVE' },
      select: { id: true },
    }),
  ])
}

export function findScheduleConflicts(
  tx: Prisma.TransactionClient,
  courseOfferingIds: string[],
  teacherIds: string[],
  startTime: Date,
  endTime: Date,
  excludeId?: string,
) {
  const activeSchedule = (rangeStart: Date, rangeEnd: Date) => ({
    status: { not: 'CANCELLED' as const },
    startTime: { lt: rangeEnd },
    endTime: { gt: rangeStart },
    ...(excludeId && { id: { not: excludeId } }),
  })
  const turnoverMs = PROCTOR_TURNOVER_MINUTES * 60 * 1000
  const proctorStart = new Date(startTime.getTime() - turnoverMs)
  const proctorEnd = new Date(endTime.getTime() + turnoverMs)
  return Promise.all([
    tx.examScheduleCourse.findFirst({
      where: { courseOfferingId: { in: courseOfferingIds }, examSchedule: activeSchedule(startTime, endTime) },
      select: { courseOffering: { select: { code: true } } },
    }),
    tx.examScheduleProctor.findFirst({
      where: { teacherId: { in: teacherIds }, examScheduleCourse: { examSchedule: activeSchedule(proctorStart, proctorEnd) } },
      select: { teacher: { select: { teacherCode: true, user: { select: { fullName: true } } } } },
    }),
  ])
}

const nestedCourses = (courses: ScheduleWriteInput['courses']) => ({
  create: courses.map(({ courseOfferingId, teacherIds }) => ({
    courseOfferingId,
    proctors: { create: teacherIds.map((teacherId) => ({ teacherId })) },
  })),
})

function scheduleFields(input: ScheduleWriteInput) {
  const { courses, examId, ...fields } = input
  return { courses, examId, fields: { ...fields, publishedAt: fields.status === 'SCHEDULED' ? new Date() : null } }
}

export async function createSchedule(tx: Prisma.TransactionClient, input: ScheduleWriteInput, createdById: string) {
  const { courses, examId, fields } = scheduleFields(input)
  return tx.examSchedule.create({
    data: {
      ...fields,
      exam: { connect: { id: examId } },
      createdBy: { connect: { id: createdById } },
      scheduleCourses: nestedCourses(courses),
    },
    include: scheduleInclude,
  })
}

export async function updateSchedule(tx: Prisma.TransactionClient, id: string, input: ScheduleWriteInput) {
  const { courses, examId, fields } = scheduleFields(input)
  await tx.examScheduleProctor.deleteMany({ where: { examScheduleCourse: { examScheduleId: id } } })
  await tx.examScheduleCourse.deleteMany({ where: { examScheduleId: id } })
  return tx.examSchedule.update({
    where: { id },
    data: { ...fields, exam: { connect: { id: examId } }, scheduleCourses: nestedCourses(courses) },
    include: scheduleInclude,
  })
}

export const cancelSchedule = (tx: Prisma.TransactionClient, id: string, reason: string) => tx.examSchedule.update({
  where: { id },
  data: { status: 'CANCELLED', cancelledAt: new Date(), cancellationReason: reason },
  include: scheduleInclude,
})

export function listReadyFinalExams() {
  return prisma.exam.findMany({
    where: { type: 'FINAL', status: 'READY', approvalStatus: 'APPROVED' },
    select: {
      id: true, title: true, totalPoints: true, defaultDurationMinutes: true, format: true,
      createdBy: { select: { user: { select: { fullName: true } } } },
      subject: { select: { id: true, code: true, name: true, departmentId: true } },
      semester: { select: { id: true, code: true, name: true } },
      _count: { select: { examQuestions: true } },
    },
    orderBy: { title: 'asc' },
  })
}
