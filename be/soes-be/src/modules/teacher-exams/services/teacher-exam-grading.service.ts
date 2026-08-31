import { ConflictError, NotFoundError, ValidationError } from '../../../errors/AppError'
import { toPagination } from '../../../utils/pagination'
import { computeScheduleStatus } from '../../exam-schedules/mappers/exam-schedule.mapper'
import { toExamSubmissionDto } from '../mappers/teacher-exam-grading.mapper'
import * as repo from '../repositories/teacher-exam-grading.repository'
import type { ManualGradeBody, ResultReleaseBody, SubmissionQuery } from '../validators/teacher-exam-grading.validator'

async function requireSchedule(teacherId: string, examId: string, scheduleId: string) {
  const schedule = await repo.findScheduleAccess(teacherId, examId, scheduleId)
  if (!schedule) throw new NotFoundError('Exam schedule not found')
  return schedule
}

async function requireClosedSchedule(teacherId: string, examId: string, scheduleId: string) {
  const schedule = await requireSchedule(teacherId, examId, scheduleId)
  const status = computeScheduleStatus(schedule.status, schedule.startTime, schedule.endTime)
  if (status !== 'CLOSED') {
    throw new ConflictError('Exam submissions can only be reviewed after the schedule has ended')
  }
  return schedule
}

export async function list(teacherId: string, examId: string, scheduleId: string, query: SubmissionQuery) {
  const schedule = await requireClosedSchedule(teacherId, examId, scheduleId)
  const courseOfferingIds = schedule.scheduleCourses.map((course) => course.courseOfferingId)
  const [total, rows] = await repo.listSubmissions(scheduleId, courseOfferingIds, query.page, query.pageSize)
  return {
    items: rows.map(toExamSubmissionDto),
    pagination: toPagination(query.page, query.pageSize, total),
    resultRelease: {
      mode: schedule.resultReleaseMode, releaseAt: schedule.resultReleaseAt,
      published: Boolean(schedule.resultsPublishedAt),
    },
  }
}

export async function listViolations(teacherId: string, examId: string, scheduleId: string, query: SubmissionQuery) {
  const schedule = await repo.findViolationScheduleAccess(teacherId, examId, scheduleId)
  if (!schedule) throw new NotFoundError('Exam schedule not found')
  const courseOfferingIds = schedule.scheduleCourses.map((course) => course.courseOfferingId)
  const [total, rows] = await repo.listViolations(scheduleId, courseOfferingIds, query.page, query.pageSize)
  return {
    items: rows.map((row) => {
      const evidence = Array.isArray(row.evidenceUrls) ? row.evidenceUrls : []
      return {
        id: row.id, scheduleId, attemptId: row.attemptId, studentId: row.attempt.studentId,
        studentCode: row.attempt.student.studentCode, studentName: row.attempt.student.user.fullName,
        type: row.violationType, timestamp: row.detectedAt, severity: row.severity,
        evidenceImageUrl: typeof evidence[0] === 'string' ? evidence[0] : null,
        note: row.description,
      }
    }),
    pagination: toPagination(query.page, query.pageSize, total),
  }
}

export async function grade(
  teacherId: string,
  userId: string,
  examId: string,
  scheduleId: string,
  attemptId: string,
  data: ManualGradeBody,
) {
  const schedule = await requireClosedSchedule(teacherId, examId, scheduleId)
  if (data.score > Number(schedule.exam.totalPoints)) {
    throw new ValidationError('Score cannot exceed exam total points')
  }
  const result = await repo.overrideScore(teacherId, userId, examId, scheduleId, attemptId, data.score, data.reason)
  if (!result) throw new NotFoundError('Exam submission not found')
  return toExamSubmissionDto(result)
}

export async function release(
  teacherId: string,
  examId: string,
  scheduleId: string,
  data: ResultReleaseBody,
) {
  await requireClosedSchedule(teacherId, examId, scheduleId)
  if (data.mode === 'SCHEDULED' && !data.releaseAt) {
    throw new ValidationError('Release time is required for scheduled results')
  }
  const result = await repo.updateResultRelease(teacherId, examId, scheduleId, {
    ...data, releaseAt: data.releaseAt ? new Date(data.releaseAt) : null,
  })
  if (!result) throw new NotFoundError('Exam schedule not found')
  return {
    mode: result.resultReleaseMode, releaseAt: result.resultReleaseAt,
    published: Boolean(result.resultsPublishedAt),
  }
}
