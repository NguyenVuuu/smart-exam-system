import type { Request, Response } from 'express'
import { sendSuccess as send } from '../../../utils/httpResponse'
import * as service from '../services/learning-topics.service'
import { assignTopicsSchema, createTopicSchema, questionParamSchema, subjectParamSchema } from '../validators/learning-topics.validator'

export const list = async (req: Request, res: Response) => send(
  res, await service.list(req.user!.profileId, subjectParamSchema.parse(req.params).subjectId),
)
export const create = async (req: Request, res: Response) => send(
  res, await service.create(req.user!.profileId, subjectParamSchema.parse(req.params).subjectId, createTopicSchema.parse(req.body)), 201,
)
export const assign = async (req: Request, res: Response) => send(
  res, await service.assign(req.user!.profileId, questionParamSchema.parse(req.params).questionId, assignTopicsSchema.parse(req.body).topicIds),
)
