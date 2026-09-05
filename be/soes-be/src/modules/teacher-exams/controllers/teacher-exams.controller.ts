import type { Request, Response } from 'express'
import { z } from 'zod'
import { sendSuccess as send } from '../../../utils/httpResponse'
import * as service from '../services/teacher-exams.service'
import * as scheduleService from '../services/teacher-exam-schedule.service'
import * as gradingService from '../services/teacher-exam-grading.service'
import * as lifecycleService from '../services/teacher-exam-lifecycle.service'
import { autoGenerateExamSchema, examApprovalQuerySchema, examBodySchema, examQuestionsSchema, examRejectionSchema, examsQuerySchema, extendTimeBodySchema } from '../validators/teacher-exams.validator'
import { teacherExamScheduleBodySchema, teacherScheduleCancellationSchema } from '../validators/teacher-exam-schedule.validator'
import { invalidateAttemptSchema, manualGradeSchema, resultReleaseSchema, submissionQuerySchema, violationReviewSchema } from '../validators/teacher-exam-grading.validator'

const idParam = z.object({ id: z.string().min(1) })
const scheduleOnlyParam = z.object({ scheduleId: z.string().min(1) })
const liveSessionParam = z.object({ sessionId: z.string().uuid() })
const liveAttemptParam = z.object({ attemptId: z.string().uuid() })
const signalBody = z.object({ signal: z.record(z.string(), z.unknown()) })
const candidateBody = z.object({ candidate: z.record(z.string(), z.unknown()) })
const cursorQuery = z.object({ from: z.coerce.number().int().min(0).optional().default(0) })
export const extendTime = async (req: Request, res: Response) =>
  send(res, await service.extendAttemptTime(req.user!.profileId, extendTimeBodySchema.parse(req.body)))

export const list = async (req: Request, res: Response) => send(res, await service.list(req.user!.profileId, examsQuerySchema.parse(req.query)))
export const get = async (req: Request, res: Response) => send(res, await service.get(req.user!.profileId, idParam.parse(req.params).id))
export const create = async (req: Request, res: Response) => send(res, await service.create(req.user!.profileId, examBodySchema.parse(req.body)), 201)
export const autoGenerate = async (req: Request, res: Response) => send(res, await service.autoGenerate(req.user!.profileId, autoGenerateExamSchema.parse(req.body)), 201)
export const update = async (req: Request, res: Response) => send(res, await service.update(req.user!.profileId, idParam.parse(req.params).id, examBodySchema.parse(req.body)))
export const replaceQuestions = async (req: Request, res: Response) => send(res, await service.replaceQuestions(req.user!.profileId, idParam.parse(req.params).id, examQuestionsSchema.parse(req.body).items))
export const submit = async (req: Request, res: Response) => send(res, await service.submit(req.user!.profileId, idParam.parse(req.params).id))
export const copy = async (req: Request, res: Response) => send(res, await service.copy(req.user!.profileId, idParam.parse(req.params).id), 201)
export const remove = async (req: Request, res: Response) => send(res, await service.remove(req.user!.profileId, idParam.parse(req.params).id))
export const lockDistribution = async (req: Request, res: Response) => send(
  res, await lifecycleService.lockDistribution(req.user!.profileId, req.user!.id, idParam.parse(req.params).id),
)
export const unlockDistribution = async (req: Request, res: Response) => send(
  res, await lifecycleService.unlockDistribution(req.user!.profileId, req.user!.id, idParam.parse(req.params).id),
)
export const listApprovals = async (req: Request, res: Response) => send(res, await service.listApprovals(req.user!.profileId, examApprovalQuerySchema.parse(req.query)))
export const approve = async (req: Request, res: Response) => send(res, await service.approve(req.user!.profileId, idParam.parse(req.params).id))
export const reject = async (req: Request, res: Response) => send(res, await service.reject(req.user!.profileId, idParam.parse(req.params).id, examRejectionSchema.parse(req.body).reason))
export const listSchedules = async (req: Request, res: Response) => send(res, await scheduleService.list(req.user!.profileId, idParam.parse(req.params).id))
export const createSchedule = async (req: Request, res: Response) => send(res, await scheduleService.create(req.user!.profileId, req.user!.id, idParam.parse(req.params).id, teacherExamScheduleBodySchema.parse(req.body)), 201)
export const updateSchedule = async (req: Request, res: Response) => {
  const params = z.object({ id: z.string().min(1), scheduleId: z.string().min(1) }).parse(req.params)
  send(res, await scheduleService.update(req.user!.profileId, req.user!.id, params.id, params.scheduleId, teacherExamScheduleBodySchema.parse(req.body)))
}
export const cancelSchedule = async (req: Request, res: Response) => {
  const params = z.object({ id: z.string().min(1), scheduleId: z.string().min(1) }).parse(req.params)
  send(res, await scheduleService.cancel(req.user!.profileId, req.user!.id, params.scheduleId, teacherScheduleCancellationSchema.parse(req.body).reason))
}

const gradingParams = z.object({
  id: z.string().min(1), scheduleId: z.string().min(1), attemptId: z.string().min(1).optional(),
})
export const listSubmissions = async (req: Request, res: Response) => {
  const { id, scheduleId } = gradingParams.parse(req.params)
  send(res, await gradingService.list(req.user!.profileId, id, scheduleId, submissionQuerySchema.parse(req.query)))
}
export const listViolations = async (req: Request, res: Response) => {
  const { id, scheduleId } = gradingParams.parse(req.params)
  send(res, await gradingService.listViolations(req.user!.profileId, id, scheduleId, submissionQuerySchema.parse(req.query)))
}
export const listProctoringSessions = async (req: Request, res: Response) => {
  const { id, scheduleId } = gradingParams.parse(req.params)
  send(res, await gradingService.listProctoringSessions(req.user!.profileId, id, scheduleId))
}
export const listLiveProctoringSessions = async (req: Request, res: Response) => {
  const { scheduleId } = scheduleOnlyParam.parse(req.params)
  send(res, await gradingService.listLiveProctoringSessions(req.user!.profileId, scheduleId))
}
export const listLiveProctoringViolations = async (req: Request, res: Response) => {
  const { scheduleId } = scheduleOnlyParam.parse(req.params)
  send(res, await gradingService.listLiveProctoringViolations(req.user!.profileId, scheduleId, submissionQuerySchema.parse(req.query)))
}
export const requestLiveCamera = async (req: Request, res: Response) => {
  const { attemptId } = liveAttemptParam.parse(req.params)
  send(res, await gradingService.requestLiveCamera(req.user!.profileId, attemptId), 201)
}
export const getTeacherLiveSession = async (req: Request, res: Response) => {
  const { sessionId } = liveSessionParam.parse(req.params)
  send(res, gradingService.getTeacherLiveSession(req.user!.profileId, sessionId))
}
export const submitTeacherLiveAnswer = async (req: Request, res: Response) => {
  const { sessionId } = liveSessionParam.parse(req.params)
  send(res, gradingService.submitTeacherLiveAnswer(req.user!.profileId, sessionId, signalBody.parse(req.body).signal))
}
export const addTeacherLiveCandidate = async (req: Request, res: Response) => {
  const { sessionId } = liveSessionParam.parse(req.params)
  send(res, gradingService.addTeacherLiveCandidate(req.user!.profileId, sessionId, candidateBody.parse(req.body).candidate), 201)
}
export const getTeacherLiveCandidates = async (req: Request, res: Response) => {
  const { sessionId } = liveSessionParam.parse(req.params)
  send(res, gradingService.getTeacherLiveCandidates(req.user!.profileId, sessionId, cursorQuery.parse(req.query).from))
}
export const endTeacherLiveSession = async (req: Request, res: Response) => {
  const { sessionId } = liveSessionParam.parse(req.params)
  send(res, gradingService.endTeacherLiveSession(req.user!.profileId, sessionId))
}
export const cameraReport = async (req: Request, res: Response) => {
  const { id, scheduleId } = gradingParams.parse(req.params)
  send(res, await gradingService.cameraReport(req.user!.profileId, id, scheduleId))
}
export const reviewViolation = async (req: Request, res: Response) => {
  const params = z.object({ id: z.string().min(1), scheduleId: z.string().min(1), violationId: z.string().min(1) }).parse(req.params)
  send(res, await gradingService.reviewViolation(
    req.user!.profileId,
    req.user!.id,
    params.id,
    params.scheduleId,
    params.violationId,
    violationReviewSchema.parse(req.body),
  ))
}
export const invalidateAttempt = async (req: Request, res: Response) => {
  const { id, scheduleId, attemptId } = gradingParams.parse(req.params)
  send(res, await gradingService.invalidateAttempt(
    req.user!.profileId,
    req.user!.id,
    id,
    scheduleId,
    attemptId!,
    invalidateAttemptSchema.parse(req.body),
  ))
}
export const gradeSubmission = async (req: Request, res: Response) => {
  const { id, scheduleId, attemptId } = gradingParams.parse(req.params)
  send(res, await gradingService.grade(
    req.user!.profileId, req.user!.id, id, scheduleId, attemptId!, manualGradeSchema.parse(req.body),
  ))
}
export const updateResultRelease = async (req: Request, res: Response) => {
  const { id, scheduleId } = gradingParams.parse(req.params)
  send(res, await gradingService.release(
    req.user!.profileId, id, scheduleId, resultReleaseSchema.parse(req.body),
  ))
}
