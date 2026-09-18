import prisma from '../../lib/prisma'
import { ConflictError, NotFoundError } from '../../errors/AppError'
import { toPagination } from '../../utils/pagination'
import { emitTeacherEvent } from '../proctoring/proctoring-realtime.events'
import type { CreateGradeAppealBody, TeacherGradeAppealQuery, UpdateGradeAppealBody } from './grade-appeals.validator'

const completedStatuses = ['SUBMITTED', 'AUTO_SUBMITTED', 'GRADING', 'GRADED', 'PUBLISHED', 'INVALIDATED'] as const

function toDto(row: any) {
  return {
    id: row.id,
    reason: row.reason,
    status: row.status,
    teacherReply: row.teacherReply,
    handledAt: row.handledAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    attemptId: row.attemptId,
    student: row.student ? {
      id: row.student.id,
      studentCode: row.student.studentCode,
      fullName: row.student.user.fullName,
    } : undefined,
    exam: row.attempt ? {
      examId: row.attempt.examSchedule.examId,
      scheduleId: row.attempt.examScheduleId,
      courseOfferingId: row.attempt.courseOfferingId,
      title: row.attempt.examSchedule.exam.title,
      scheduleTitle: row.attempt.examSchedule.title,
      score: row.attempt.totalScore === null ? null : Number(row.attempt.totalScore),
      maxScore: Number(row.attempt.examSchedule.exam.totalPoints),
      submittedAt: row.attempt.submittedAt,
    } : undefined,
    handledBy: row.handledBy ? {
      id: row.handledBy.id,
      fullName: row.handledBy.user.fullName,
    } : null,
  }
}

export async function createStudentAppeal(
  studentId: string,
  scheduleId: string,
  attemptId: string,
  body: CreateGradeAppealBody,
) {
  const attempt = await prisma.examAttempt.findFirst({
    where: { id: attemptId, examScheduleId: scheduleId, studentId },
    include: {
      student: { include: { user: true } },
      courseOffering: { include: { teacher: { include: { user: true } } } },
      examSchedule: { include: { exam: true } },
    },
  })
  if (!attempt) throw new NotFoundError('Exam attempt not found')
  if (!completedStatuses.includes(attempt.status as any)) {
    throw new ConflictError('Grade appeal can only be created after the attempt is completed')
  }

  const existingAppeal = await prisma.gradeAppeal.findFirst({
    where: { attemptId, studentId },
  })
  if (existingAppeal) throw new ConflictError('Only one grade appeal is allowed for this attempt')

  const row = await prisma.gradeAppeal.create({
    data: {
      attemptId,
      studentId,
      reason: body.reason,
    },
    include: includeAppeal(),
  })
  const dto = toDto(row)
  const teacher = attempt.courseOffering.teacher
  const notificationPayload = {
    ...dto,
    teacherId: teacher.id,
    receivedAt: new Date().toISOString(),
  }

  await prisma.notification.create({
    data: {
      userId: teacher.userId,
      title: 'Yêu cầu phúc khảo mới',
      content: `${attempt.student.user.fullName} (${attempt.student.studentCode}) đã gửi phúc khảo cho ${attempt.examSchedule.exam.title}.`,
    },
  })
  emitTeacherEvent(teacher.id, 'grade_appeal:created', notificationPayload)
  return dto
}

export async function listStudentAppeals(studentId: string, scheduleId: string, attemptId: string) {
  const attempt = await prisma.examAttempt.findFirst({ where: { id: attemptId, examScheduleId: scheduleId, studentId } })
  if (!attempt) throw new NotFoundError('Exam attempt not found')
  const rows = await prisma.gradeAppeal.findMany({
    where: { attemptId, studentId },
    orderBy: { createdAt: 'desc' },
    include: includeAppeal(),
  })
  return { items: rows.map(toDto) }
}

export async function listTeacherAppeals(teacherId: string, query: TeacherGradeAppealQuery) {
  const where = {
    ...(query.status === 'ALL' ? {} : { status: query.status }),
    attempt: {
      examSchedule: {
        scheduleCourses: {
          some: {
            OR: [
              { courseOffering: { teacherId } },
              { proctors: { some: { teacherId } } },
            ],
          },
        },
      },
    },
  }
  const [total, rows] = await Promise.all([
    prisma.gradeAppeal.count({ where }),
    prisma.gradeAppeal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: includeAppeal(),
    }),
  ])
  return { items: rows.map(toDto), pagination: toPagination(query.page, query.pageSize, total) }
}

export async function updateTeacherAppeal(teacherId: string, appealId: string, body: UpdateGradeAppealBody) {
  const appeal = await prisma.gradeAppeal.findFirst({
    where: {
      id: appealId,
      attempt: {
        examSchedule: {
          scheduleCourses: {
            some: {
              OR: [
                { courseOffering: { teacherId } },
                { proctors: { some: { teacherId } } },
              ],
            },
          },
        },
      },
    },
  })
  if (!appeal) throw new NotFoundError('Grade appeal not found')
  if (!['PENDING', 'IN_REVIEW'].includes(appeal.status)) {
    throw new ConflictError('Grade appeal has already been completed')
  }

  const row = await prisma.gradeAppeal.update({
    where: { id: appealId },
    data: {
      status: body.status,
      teacherReply: body.teacherReply,
      handledById: teacherId,
      handledAt: body.status === 'IN_REVIEW' ? null : new Date(),
    },
    include: includeAppeal(),
  })
  const dto = toDto(row)
  emitTeacherEvent(teacherId, 'grade_appeal:updated', dto)
  return dto
}

function includeAppeal() {
  return {
    student: { include: { user: true } },
    handledBy: { include: { user: true } },
    attempt: {
      include: {
        examSchedule: { include: { exam: true } },
      },
    },
  } as const
}
