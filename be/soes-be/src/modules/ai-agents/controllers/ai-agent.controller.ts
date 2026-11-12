import type { Request, Response } from 'express'
import { sendSuccess as send } from '../../../utils/httpResponse'
import { askStudent, askTeacher } from '../services/ai-agent.service'
import { askAgentSchema, scheduleParamSchema } from '../validators/ai-agent.validator'

export const studentAsk = async (req: Request, res: Response) => send(
  res, await askStudent(req.user!.profileId, askAgentSchema.parse(req.body).message),
)

export const teacherAsk = async (req: Request, res: Response) => send(
  res, await askTeacher(
    req.user!.profileId,
    scheduleParamSchema.parse(req.params).scheduleId,
    askAgentSchema.parse(req.body).message,
  ),
)
