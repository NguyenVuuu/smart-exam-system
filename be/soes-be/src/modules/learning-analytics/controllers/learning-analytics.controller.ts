import type { Request, Response } from 'express'
import { sendSuccess as send } from '../../../utils/httpResponse'
import { studentInsights } from '../services/learning-analytics.service'
import { teacherScheduleInsights } from '../services/learning-analytics.service'
import { z } from 'zod'

export const getStudentInsights = async (req: Request, res: Response) => send(
  res, await studentInsights(req.user!.profileId),
)

const scheduleParamSchema = z.object({ scheduleId: z.string().uuid() })
export const getTeacherScheduleInsights = async (req: Request, res: Response) => send(
  res, await teacherScheduleInsights(req.user!.profileId, scheduleParamSchema.parse(req.params).scheduleId),
)
