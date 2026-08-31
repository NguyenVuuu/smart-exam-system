import bcrypt from 'bcrypt'
import { ConflictError, NotFoundError, ValidationError } from '../../../errors/AppError'
import { toPagination } from '../../../utils/pagination'
import { runSerializable } from '../../../utils/transaction'
import { computeScheduleStatus, toExamScheduleDto } from '../mappers/exam-schedule.mapper'
import * as repo from '../repositories/exam-schedule.repository'
import { PROCTOR_TURNOVER_MINUTES } from '../repositories/exam-schedule.repository'
import type { ScheduleWriteInput } from '../types/exam-schedule.types'
import type { ScheduleBody, SchedulesQuery } from '../validators/exam-schedule.validator'

const saltRounds = 10

function flattenAssignments(data: Pick<ScheduleWriteInput, 'courses'>) {
  return {
    courseIds: data.courses.map(({ courseOfferingId }) => courseOfferingId),
    teacherIds: [...new Set(data.courses.flatMap(({ teacherIds }) => teacherIds))],
  }
}

async function prepareInput(data: ScheduleBody, preserveBlankPassword = false): Promise<ScheduleWriteInput> {
  const { password, ...fields } = data
  const passwordHash = password
    ? await bcrypt.hash(password, saltRounds)
    : preserveBlankPassword && password === undefined ? undefined : null
  return {
    ...fields,
    passwordHash,
    maxTabSwitches: data.maxTabSwitches ?? null,
    randomQuestionCount: data.randomQuestionCount ?? null,
    resultReleaseAt: data.resultReleaseAt ?? null,
    reviewStartAt: data.reviewStartAt ?? null,
    reviewEndAt: data.reviewEndAt ?? null,
  }
}

async function validateContext(
  tx: Parameters<Parameters<typeof runSerializable>[0]>[0],
  input: ScheduleWriteInput,
  excludeId?: string,
) {
  const { courseIds, teacherIds } = flattenAssignments(input)
  const [exam, courses, teachers] = await repo.findCreationContext(tx, input.examId, courseIds, teacherIds)
  if (!exam) throw new NotFoundError('Exam not found')
  if (exam.type !== 'FINAL' || exam.status !== 'READY' || exam.approvalStatus !== 'APPROVED') {
    throw new ValidationError('Only approved and ready final exams can be centrally scheduled')
  }
  if (!exam.examQuestions.length) throw new ValidationError('Exam has no questions')
  if (courses.length !== courseIds.length || courses.some(({ subjectId, semesterId, status }) =>
    subjectId !== exam.subjectId || semesterId !== exam.semesterId || status !== 'ACTIVE')) {
    throw new ValidationError('All course offerings must be active and belong to the exam subject and semester')
  }
  if (teachers.length !== teacherIds.length) throw new ValidationError('One or more proctors are invalid or inactive')
  const [courseConflict, proctorConflict] = await repo.findScheduleConflicts(
    tx, courseIds, teacherIds, input.startTime, input.endTime, excludeId,
  )
  if (courseConflict) throw new ConflictError(`Course offering ${courseConflict.courseOffering.code} already has an overlapping exam`)
  if (proctorConflict) {
    throw new ConflictError(
      `Proctor ${proctorConflict.teacher.user.fullName} already has an overlapping assignment or less than ${PROCTOR_TURNOVER_MINUTES} minutes between schedules`,
    )
  }
}

export async function list(query: SchedulesQuery) {
  const [total, rows] = await repo.listSchedules(query)
  return { items: rows.map(toExamScheduleDto), pagination: toPagination(query.page, query.pageSize, total) }
}

export async function get(id: string) {
  const row = await repo.findSchedule(id)
  if (!row) throw new NotFoundError('Exam schedule not found')
  return toExamScheduleDto(row)
}

export const listReadyExams = () => repo.listReadyFinalExams()

export async function create(createdById: string, data: ScheduleBody) {
  const input = await prepareInput(data)
  const row = await runSerializable(async (tx) => {
    await validateContext(tx, input)
    return repo.createSchedule(tx, input, createdById)
  })
  return toExamScheduleDto(row)
}

export async function update(id: string, data: ScheduleBody) {
  const input = await prepareInput(data, true)
  const row = await runSerializable(async (tx) => {
    const current = await repo.findScheduleInTransaction(tx, id)
    if (!current) throw new NotFoundError('Exam schedule not found')
    const status = computeScheduleStatus(current.status, current.startTime, current.endTime)
    if (!['DRAFT', 'SCHEDULED'].includes(status) || current._count.attempts > 0) {
      throw new ConflictError('Exam schedule is locked and cannot be updated')
    }
    await validateContext(tx, input, id)
    return repo.updateSchedule(tx, id, input)
  })
  return toExamScheduleDto(row)
}

export async function cancel(id: string, reason: string) {
  const row = await runSerializable(async (tx) => {
    const current = await repo.findScheduleInTransaction(tx, id)
    if (!current) throw new NotFoundError('Exam schedule not found')
    const status = computeScheduleStatus(current.status, current.startTime, current.endTime)
    if (!['DRAFT', 'SCHEDULED'].includes(status)) throw new ConflictError('Exam schedule cannot be cancelled')
    return repo.cancelSchedule(tx, id, reason)
  })
  return toExamScheduleDto(row)
}
