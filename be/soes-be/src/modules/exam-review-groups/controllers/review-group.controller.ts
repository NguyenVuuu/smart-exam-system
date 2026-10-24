import type { Request, Response } from 'express'
import { sendSuccess } from '../../../utils/httpResponse'
import * as service from '../services/review-group.service'
import { groupBodySchema, groupStatusSchema } from '../validators/review-group.validator'

export const get = async (req: Request, res: Response) =>
  sendSuccess(res, await service.get(req.user!.profileId))

export const create = async (req: Request, res: Response) =>
  sendSuccess(res, await service.create(req.user!.profileId, groupBodySchema.parse(req.body).name), 201)

export const rename = async (req: Request, res: Response) =>
  sendSuccess(res, await service.rename(req.user!.profileId, groupBodySchema.parse(req.body).name))

export const setStatus = async (req: Request, res: Response) =>
  sendSuccess(res, await service.setStatus(req.user!.profileId, groupStatusSchema.parse(req.body).status))
