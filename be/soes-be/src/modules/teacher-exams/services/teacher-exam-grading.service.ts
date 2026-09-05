import { ConflictError, NotFoundError, ValidationError } from '../../../errors/AppError'
import { examConfig } from '../../../config'
import { getLocalViolationEvidenceUrl, getViolationEvidenceUrl } from '../../../lib/minio'
import { logger } from '../../../lib/logger'
import { toPagination } from '../../../utils/pagination'
import { computeScheduleStatus } from '../../exam-schedules/mappers/exam-schedule.mapper'
import { toExamSubmissionDto } from '../mappers/teacher-exam-grading.mapper'
import * as repo from '../repositories/teacher-exam-grading.repository'
import type { InvalidateAttemptBody, ManualGradeBody, ResultReleaseBody, SubmissionQuery, ViolationReviewBody } from '../validators/teacher-exam-grading.validator'
import * as live from '../../proctoring-live/proctoring-live.service'

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
  const items = await Promise.all(rows.map(async (row) => {
    const firstEvidence = row.evidences[0] ?? null
    let evidenceImageUrl: string | null = null

    if (firstEvidence) {
      try {
        evidenceImageUrl = firstEvidence.storageProvider === 'LOCAL'
          ? getLocalViolationEvidenceUrl(firstEvidence.objectName)
          : await getViolationEvidenceUrl(firstEvidence.objectName)
      } catch (error) {
        logger.error('Failed to create violation evidence URL', {
          violationId: row.id,
          objectName: firstEvidence.objectName,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    return {
      id: row.id, scheduleId, attemptId: row.attemptId, studentId: row.attempt.studentId,
      studentCode: row.attempt.student.studentCode, studentName: row.attempt.student.user.fullName,
      type: row.violationType, timestamp: row.detectedAt, severity: row.severity,
      endedAt: row.endedAt,
      durationSeconds: row.durationSeconds,
      evidenceImageUrl,
      note: row.description,
    }
  }))

  return {
    items,
    pagination: toPagination(query.page, query.pageSize, total),
  }
}

export async function listProctoringSessions(teacherId: string, examId: string, scheduleId: string) {
  const schedule = await repo.findViolationScheduleAccess(teacherId, examId, scheduleId)
  if (!schedule) throw new NotFoundError('Exam schedule not found')

  const now = new Date()
  const courseOfferingIds = schedule.scheduleCourses.map((course) => course.courseOfferingId)
  const rows = await repo.listProctoringSessions(scheduleId, courseOfferingIds)

  return {
    items: rows.map((row) => {
      const lastHeartbeat = row.examSession?.lastHeartbeat ?? null
      const isOnline = lastHeartbeat !== null &&
        now.getTime() - lastHeartbeat.getTime() <= examConfig.heartbeatTimeoutMs

      const lastViolation = row.violations[0] ?? null

      return {
        attemptId: row.id,
        scheduleId,
        studentId: row.student.id,
        studentCode: row.student.studentCode,
        studentName: row.student.user.fullName,
        attemptStatus: row.status,
        isOnline,
        ipAddress: row.examSession?.ipAddress ?? null,
        webcamStatus: row.examSession?.webcamStatus ?? 'NOT_REQUIRED',
        lastHeartbeatAt: lastHeartbeat,
        lastWebcamHeartbeatAt: row.examSession?.lastWebcamHeartbeatAt ?? null,
        answeredCount: row._count.studentAnswers,
        totalQuestionCount: row._count.attemptQuestions,
        violationCount: row._count.violations,
        lastViolation: lastViolation
          ? {
              type: lastViolation.violationType,
              detectedAt: lastViolation.detectedAt,
              endedAt: lastViolation.endedAt,
              durationSeconds: lastViolation.durationSeconds,
              description: lastViolation.description,
            }
          : null,
      }
    }),
  }
}

export async function listLiveProctoringSessions(teacherId: string, scheduleId: string) {
  const schedule = await repo.findViolationScheduleAccessBySchedule(teacherId, scheduleId)
  if (!schedule) throw new NotFoundError('Exam schedule not found')

  const result = await listProctoringSessions(teacherId, schedule.examId, scheduleId)
  return {
    schedule: {
      id: schedule.id,
      examId: schedule.examId,
      title: schedule.title,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
    },
    items: result.items,
  }
}

export async function listLiveProctoringViolations(teacherId: string, scheduleId: string, query: SubmissionQuery) {
  const schedule = await repo.findViolationScheduleAccessBySchedule(teacherId, scheduleId)
  if (!schedule) throw new NotFoundError('Exam schedule not found')
  return listViolations(teacherId, schedule.examId, scheduleId, query)
}

export async function requestLiveCamera(teacherId: string, attemptId: string) {
  const attempt = await repo.findAttemptAccessForLiveProctoring(teacherId, attemptId)
  if (!attempt) throw new NotFoundError('Exam attempt not found')
  if (!attempt.examSchedule.enableWebcam) throw new ConflictError('Webcam is not enabled for this schedule')
  return live.requestLiveCamera({ attemptId, scheduleId: attempt.examScheduleId, teacherId })
}

export function getTeacherLiveSession(teacherId: string, sessionId: string) {
  const session = live.getTeacherLiveSession(sessionId, teacherId)
  if (!session) throw new NotFoundError('Live session not found')
  return session
}

export function submitTeacherLiveAnswer(teacherId: string, sessionId: string, answer: Record<string, unknown>) {
  const session = live.submitTeacherAnswer({ teacherId, sessionId, answer })
  if (!session) throw new NotFoundError('Live session not found')
  return session
}

export function addTeacherLiveCandidate(teacherId: string, sessionId: string, candidate: Record<string, unknown>) {
  const result = live.addTeacherCandidate({ teacherId, sessionId, candidate })
  if (!result) throw new NotFoundError('Live session not found')
  return result
}

export function getTeacherLiveCandidates(teacherId: string, sessionId: string, from: number) {
  const result = live.getStudentCandidates(sessionId, teacherId, from)
  if (!result) throw new NotFoundError('Live session not found')
  return result
}

export function endTeacherLiveSession(teacherId: string, sessionId: string) {
  const session = live.endLiveSession(sessionId, { teacherId })
  if (!session) throw new NotFoundError('Live session not found')
  return session
}

export async function reviewViolation(
  teacherId: string,
  userId: string,
  examId: string,
  scheduleId: string,
  violationId: string,
  data: ViolationReviewBody,
) {
  const result = await repo.updateViolationReview({
    teacherId,
    userId,
    examId,
    scheduleId,
    violationId,
    reviewStatus: data.reviewStatus,
    reviewNote: data.reviewNote,
  })
  if (!result) throw new NotFoundError('Violation not found')
  return result
}

export async function invalidateAttempt(
  teacherId: string,
  userId: string,
  examId: string,
  scheduleId: string,
  attemptId: string,
  data: InvalidateAttemptBody,
) {
  const result = await repo.invalidateAttempt({
    teacherId,
    userId,
    examId,
    scheduleId,
    attemptId,
    reason: data.reason,
  })
  if (!result) throw new NotFoundError('Exam attempt not found')
  return result
}

export async function cameraReport(teacherId: string, examId: string, scheduleId: string) {
  const schedule = await repo.findViolationScheduleAccess(teacherId, examId, scheduleId)
  if (!schedule) throw new NotFoundError('Exam schedule not found')

  const rows = await repo.listCameraReport(
    scheduleId,
    schedule.scheduleCourses.map((course) => course.courseOfferingId),
  )

  return {
    items: rows.map((row) => {
      const count = (type: string) => row.violations.filter((violation) => violation.violationType === type).length
      const reviewCount = (status: string) => row.violations.filter((violation) => violation.reviewStatus === status).length
      const highCount = row.violations.filter((violation) => violation.severity === 'HIGH').length
      const pendingCount = reviewCount('PENDING')
      const confirmedCount = reviewCount('CONFIRMED')
      const totalDisconnectedSeconds = row.violations
        .filter((violation) => ['CAMERA_DISCONNECTED', 'CAMERA_PERMISSION_DENIED', 'CAMERA_BLOCKED'].includes(violation.violationType))
        .reduce((total, violation) => total + (violation.durationSeconds ?? 0), 0)
      const evidenceCount = row.violations.reduce((total, violation) => total + violation.evidences.length, 0)

      return {
        attemptId: row.id,
        studentCode: row.student.studentCode,
        studentName: row.student.user.fullName,
        cameraDisconnectedCount: count('CAMERA_DISCONNECTED') + count('CAMERA_PERMISSION_DENIED') + count('CAMERA_BLOCKED'),
        totalCameraDisconnectedSeconds: totalDisconnectedSeconds,
        noFaceCount: count('NO_FACE'),
        multipleFacesCount: count('MULTIPLE_FACES'),
        cameraBlockedCount: count('CAMERA_BLOCKED'),
        evidenceCount,
        confirmedCount,
        dismissedCount: reviewCount('DISMISSED'),
        pendingCount,
        riskSummary: highCount > 0 || confirmedCount > 0
          ? 'SERIOUS'
          : pendingCount > 0 || row.violations.length >= 3
            ? 'NEEDS_REVIEW'
            : 'NORMAL',
      }
    }),
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
