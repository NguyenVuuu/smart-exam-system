import type { Request, Response } from 'express'
import { z } from 'zod'
import { sendSuccess as send } from '../../../utils/httpResponse'
import * as service from '../services/teacher-exams.service'
import * as scheduleService from '../services/teacher-exam-schedule.service'
import { examApprovalQuerySchema, examBodySchema, examQuestionsSchema, examRejectionSchema, examsQuerySchema, extendTimeBodySchema } from '../validators/teacher-exams.validator'
import { teacherExamScheduleBodySchema, teacherScheduleCancellationSchema } from '../validators/teacher-exam-schedule.validator'

const idParam = z.object({ id: z.string().min(1) })
export const extendTime = async (req: Request, res: Response) =>
  send(res, await service.extendAttemptTime(req.user!.profileId, extendTimeBodySchema.parse(req.body)))

export const list = async (req: Request, res: Response) => send(res, await service.list(req.user!.profileId, examsQuerySchema.parse(req.query)))
export const get = async (req: Request, res: Response) => send(res, await service.get(req.user!.profileId, idParam.parse(req.params).id))
export const create = async (req: Request, res: Response) => send(res, await service.create(req.user!.profileId, examBodySchema.parse(req.body)), 201)
export const update = async (req: Request, res: Response) => send(res, await service.update(req.user!.profileId, idParam.parse(req.params).id, examBodySchema.parse(req.body)))
export const replaceQuestions = async (req: Request, res: Response) => send(res, await service.replaceQuestions(req.user!.profileId, idParam.parse(req.params).id, examQuestionsSchema.parse(req.body).items))
export const submit = async (req: Request, res: Response) => send(res, await service.submit(req.user!.profileId, idParam.parse(req.params).id))
export const copy = async (req: Request, res: Response) => send(res, await service.copy(req.user!.profileId, idParam.parse(req.params).id), 201)
export const remove = async (req: Request, res: Response) => send(res, await service.remove(req.user!.profileId, idParam.parse(req.params).id))
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
