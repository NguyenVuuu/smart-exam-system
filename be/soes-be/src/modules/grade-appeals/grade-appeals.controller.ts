import type { Request, Response } from 'express'
import { z } from 'zod'
import { sendSuccess as send } from '../../utils/httpResponse'
import * as service from './grade-appeals.service'
import { createGradeAppealSchema, teacherGradeAppealQuerySchema, updateGradeAppealSchema } from './grade-appeals.validator'

const attemptParams = z.object({ scheduleId: z.string().min(1), attemptId: z.string().min(1) })
const appealParams = z.object({ appealId: z.string().min(1) })

export const createStudentAppeal = async (req: Request, res: Response) => {
  const { scheduleId, attemptId } = attemptParams.parse(req.params)
  send(res, await service.createStudentAppeal(
    req.user!.profileId,
    scheduleId,
    attemptId,
    createGradeAppealSchema.parse(req.body),
  ), 201)
}

export const listStudentAppeals = async (req: Request, res: Response) => {
  const { scheduleId, attemptId } = attemptParams.parse(req.params)
  send(res, await service.listStudentAppeals(req.user!.profileId, scheduleId, attemptId))
}

export const listTeacherAppeals = async (req: Request, res: Response) => {
  send(res, await service.listTeacherAppeals(req.user!.profileId, teacherGradeAppealQuerySchema.parse(req.query)))
}

export const updateTeacherAppeal = async (req: Request, res: Response) => {
  const { appealId } = appealParams.parse(req.params)
  send(res, await service.updateTeacherAppeal(
    req.user!.profileId,
    appealId,
    updateGradeAppealSchema.parse(req.body),
  ))
}
