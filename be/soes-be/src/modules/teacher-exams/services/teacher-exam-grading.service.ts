import type { ScreenShareStatus, WebcamStatus } from '@prisma/client'
import { ConflictError, NotFoundError, ValidationError } from '../../../errors/AppError'
import { examConfig, minioConfig } from '../../../config'
import { getLocalViolationEvidenceUrl, getViolationEvidenceUrl, saveViolationEvidenceFilesLocal, uploadViolationEvidenceFiles } from '../../../lib/minio'
import { logger } from '../../../lib/logger'
import { toPagination } from '../../../utils/pagination'
import { computeScheduleStatus } from '../../exam-schedules/mappers/exam-schedule.mapper'
import { toExamSubmissionDto } from '../mappers/teacher-exam-grading.mapper'
import * as repo from '../repositories/teacher-exam-grading.repository'
import type { InvalidateAttemptBody, ManualGradeBody, ResultReleaseBody, SubmissionQuery, ViolationQuery, ViolationReviewBody } from '../validators/teacher-exam-grading.validator'
import * as live from '../../proctoring-live/proctoring-live.service'
import { emitProctoringEvent, emitStudentEvent, emitTeacherEvent } from '../../proctoring/proctoring-realtime.events'
import { notifyUsers } from '../../notifications/notifications.service'

function currentWebcamStatus(status: WebcamStatus, isActive: boolean): WebcamStatus {
  return !isActive && status === 'ACTIVE' ? 'DISCONNECTED' : status
}

function currentScreenShareStatus(status: ScreenShareStatus, isActive: boolean): ScreenShareStatus {
  return !isActive && status === 'ACTIVE' ? 'STOPPED' : status
}

function isScreenEvidenceViolation(type: string): boolean {
  return type === 'TAB_SWITCH' || type === 'FULLSCREEN_EXIT'
}

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

export async function listViolations(teacherId: string, examId: string, scheduleId: string, query: ViolationQuery) {
  const schedule = await repo.findViolationScheduleAccess(teacherId, examId, scheduleId)
  if (!schedule) throw new NotFoundError('Exam schedule not found')
  const courseOfferingIds = schedule.scheduleCourses.map((course) => course.courseOfferingId)
  const [total, rows] = await repo.listViolations(scheduleId, courseOfferingIds, query.page, query.pageSize, {
    keyword: query.keyword,
    studentId: query.studentId,
    violationType: query.violationType,
  })
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
      reviewStatus: row.reviewStatus,
      reviewNote: row.reviewNote,
      reviewedAt: row.reviewedAt,
      endedAt: row.endedAt,
      durationSeconds: row.durationSeconds,
      evidenceImageUrl,
      evidenceText: !evidenceImageUrl && !schedule.enableScreenMonitoring && isScreenEvidenceViolation(row.violationType)
        ? 'Không có ảnh vì ca thi không cấu hình share màn hình'
        : null,
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
      const isInProgress = row.status === 'IN_PROGRESS'
      const isOnline = isInProgress && lastHeartbeat !== null &&
        now.getTime() - lastHeartbeat.getTime() <= examConfig.heartbeatTimeoutMs
      const webcamStatus = row.examSession?.webcamStatus ?? 'NOT_REQUIRED'
      const screenShareStatus = row.examSession?.screenShareStatus ?? 'NOT_REQUIRED'

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
        webcamStatus: currentWebcamStatus(webcamStatus, isOnline),
        screenShareStatus: currentScreenShareStatus(screenShareStatus, isOnline),
        lastHeartbeatAt: lastHeartbeat,
        lastWebcamHeartbeatAt: row.examSession?.lastWebcamHeartbeatAt ?? null,
        lastScreenHeartbeatAt: row.examSession?.lastScreenHeartbeatAt ?? null,
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

export async function listLiveProctoringViolations(teacherId: string, scheduleId: string, query: ViolationQuery) {
  const schedule = await repo.findViolationScheduleAccessBySchedule(teacherId, scheduleId)
  if (!schedule) throw new NotFoundError('Exam schedule not found')
  return listViolations(teacherId, schedule.examId, scheduleId, query)
}

export async function requestLiveCamera(teacherId: string, attemptId: string) {
  const attempt = await repo.findAttemptAccessForLiveProctoring(teacherId, attemptId)
  if (!attempt) throw new NotFoundError('Exam attempt not found')
  if (!attempt.examSchedule.enableWebcam) throw new ConflictError('Webcam is not enabled for this schedule')
  return live.requestLiveStream({ attemptId, scheduleId: attempt.examScheduleId, teacherId, streamType: 'WEBCAM' })
}

export async function requestLiveScreen(teacherId: string, attemptId: string) {
  const attempt = await repo.findAttemptAccessForLiveProctoring(teacherId, attemptId)
  if (!attempt) throw new NotFoundError('Exam attempt not found')
  if (!attempt.examSchedule.enableScreenMonitoring) throw new ConflictError('Screen monitoring is not enabled for this schedule')
  return live.requestLiveStream({ attemptId, scheduleId: attempt.examScheduleId, teacherId, streamType: 'SCREEN' })
}

export async function getTeacherLiveSession(teacherId: string, sessionId: string) {
  const session = await live.getTeacherLiveSession(sessionId, teacherId)
  if (!session) throw new NotFoundError('Live session not found')
  return session
}

export async function submitTeacherLiveAnswer(teacherId: string, sessionId: string, answer: Record<string, unknown>) {
  const session = await live.submitTeacherAnswer({ teacherId, sessionId, answer })
  if (!session) throw new NotFoundError('Live session not found')
  return session
}

export async function addTeacherLiveCandidate(teacherId: string, sessionId: string, candidate: Record<string, unknown>) {
  const result = await live.addTeacherCandidate({ teacherId, sessionId, candidate })
  if (!result) throw new NotFoundError('Live session not found')
  return result
}

export async function getTeacherLiveCandidates(teacherId: string, sessionId: string, from: number) {
  const result = await live.getStudentCandidates(sessionId, teacherId, from)
  if (!result) throw new NotFoundError('Live session not found')
  return result
}

export async function endTeacherLiveSession(teacherId: string, sessionId: string) {
  const session = await live.endLiveSession(sessionId, { teacherId })
  if (!session) throw new NotFoundError('Live session not found')
  return session
}

export async function captureManualEvidence(
  teacherId: string,
  teacherUserId: string,
  attemptId: string,
  streamType: 'WEBCAM' | 'SCREEN',
  evidenceFiles: Express.Multer.File[] = [],
) {
  const attempt = await repo.findAttemptForManualEvidence(teacherId, attemptId)
  if (!attempt) throw new NotFoundError('Exam attempt not found')
  if (streamType === 'WEBCAM' && !attempt.examSchedule.enableWebcam) {
    throw new ConflictError('Webcam is not enabled for this schedule')
  }
  if (streamType === 'SCREEN' && !attempt.examSchedule.enableScreenMonitoring) {
    throw new ConflictError('Screen monitoring is not enabled for this schedule')
  }
  if (evidenceFiles.length === 0) {
    throw new ValidationError('Evidence file is required')
  }

  const detectedAt = new Date()
  const violationType = streamType === 'WEBCAM' ? 'PROCTOR_WEBCAM_CAPTURE' : 'PROCTOR_SCREEN_CAPTURE'
  const evidenceType = streamType === 'WEBCAM' ? 'WEBCAM_IMAGE' : 'SCREEN_IMAGE'
  const violation = await repo.createManualProctorViolation({
    attemptId,
    teacherUserId,
    violationType,
    detectedAt,
    description: streamType === 'WEBCAM'
      ? 'Teacher captured webcam evidence from live proctoring.'
      : 'Teacher captured screen evidence from live proctoring.',
  })

  let evidenceObjectNames: string[] = []
  let evidenceStorageProvider: 'MINIO' | 'LOCAL' = 'MINIO'
  try {
    evidenceObjectNames = await uploadViolationEvidenceFiles({
      attemptId,
      violationType,
      detectedAt,
      files: evidenceFiles,
      storagePrefix: attempt.examSchedule.proctoringStoragePath,
      violationId: violation.id,
    })
  } catch (error) {
    logger.error('Failed to upload manual proctoring evidence', {
      attemptId,
      violationType,
      error: error instanceof Error ? error.message : String(error),
    })
    if (minioConfig.requireEvidenceStorage) {
      throw new ValidationError('Evidence storage is not available')
    }
    evidenceStorageProvider = 'LOCAL'
    evidenceObjectNames = await saveViolationEvidenceFilesLocal({
      attemptId,
      violationType,
      detectedAt,
      files: evidenceFiles,
      storagePrefix: attempt.examSchedule.proctoringStoragePath,
      violationId: violation.id,
    })
  }

  await repo.addManualViolationEvidence({
    violationId: violation.id,
    teacherUserId,
    evidenceType,
    evidences: evidenceObjectNames.map((objectName, index) => {
      const file = evidenceFiles[index]
      return {
        bucket: minioConfig.evidenceBucket,
        objectName,
        storagePath: objectName.split('/').slice(0, -1).join('/'),
        fileName: file?.originalname ?? objectName.split('/').pop() ?? 'evidence.jpg',
        contentType: file?.mimetype ?? 'image/jpeg',
        fileSize: file?.size,
        storageProvider: evidenceStorageProvider,
      }
    }),
  })

  const firstEvidence = evidenceObjectNames[0] ?? null
  const evidenceImageUrl = firstEvidence
    ? evidenceStorageProvider === 'LOCAL'
      ? getLocalViolationEvidenceUrl(firstEvidence)
      : await getViolationEvidenceUrl(firstEvidence)
    : null

  const payload = {
    id: violation.id,
    scheduleId: attempt.examScheduleId,
    attemptId,
    studentId: attempt.studentId,
    studentCode: attempt.student.studentCode,
    studentName: attempt.student.user.fullName,
    type: violation.violationType,
    timestamp: violation.detectedAt.toISOString(),
    severity: violation.severity,
    endedAt: violation.endedAt?.toISOString() ?? null,
    durationSeconds: violation.durationSeconds,
    evidenceImageUrl,
    note: streamType === 'WEBCAM' ? 'Teacher webcam capture' : 'Teacher screen capture',
  }
  emitProctoringEvent(attempt.examScheduleId, 'violation:created', payload)
  return payload
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
  emitProctoringEvent(scheduleId, 'violation:reviewed', result)
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
  emitProctoringEvent(scheduleId, 'attempt:invalidated', result)
  await notifyUsers(
    [result.student.userId],
    'Bài thi bị xử lý vi phạm',
    `Bài thi "${result.examSchedule.title}" của bạn đã bị xử lý vi phạm. Lý do: ${data.reason}`,
  )
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
  const appeal = await repo.findGradeAppealByAttempt(attemptId)
  if (appeal && !['PENDING', 'IN_REVIEW'].includes(appeal.status)) {
    throw new ConflictError('This grade appeal has already been completed')
  }
  const result = await repo.overrideScore(teacherId, userId, examId, scheduleId, attemptId, data.score, data.reason)
  if (!result) throw new NotFoundError('Exam submission not found')
  const dto = toExamSubmissionDto(result)
  const appealUpdate = {
    attemptId,
    scheduleId,
    status: 'RESOLVED',
    teacherReply: data.reason,
    score: data.score,
  }
  emitTeacherEvent(teacherId, 'grade_appeal:updated', appealUpdate)
  if (appeal) emitStudentEvent(appeal.studentId, 'grade_appeal:updated', appealUpdate)
  return dto
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
  if (result.resultsPublishedAt) {
    const userIds = await repo.listScheduleStudentUserIds(scheduleId)
    await notifyUsers(userIds, 'Điểm đã được công bố', `Điểm bài thi "${result.title}" đã được công bố. Bạn có thể xem trong mục điểm.`)
  }
  return {
    mode: result.resultReleaseMode, releaseAt: result.resultReleaseAt,
    published: Boolean(result.resultsPublishedAt),
  }
}
