import type { Request, Response } from 'express'
import { sendSuccess } from '../../../utils/httpResponse'
import * as service from '../services/review-group.service'
import { groupBodySchema, groupStatusSchema, memberParamSchema } from '../validators/review-group.validator'

export const get = async (req: Request, res: Response) =>
  sendSuccess(res, await service.get(req.user!.profileId))

export const create = async (req: Request, res: Response) =>
  sendSuccess(res, await service.create(req.user!.profileId, groupBodySchema.parse(req.body).name), 201)

export const rename = async (req: Request, res: Response) =>
  sendSuccess(res, await service.rename(req.user!.profileId, groupBodySchema.parse(req.body).name))

export const setStatus = async (req: Request, res: Response) =>
  sendSuccess(res, await service.setStatus(req.user!.profileId, groupStatusSchema.parse(req.body).status))

export const listCandidates = async (req: Request, res: Response) =>
  sendSuccess(res, await service.listCandidates(req.user!.profileId))

export const addMember = async (req: Request, res: Response) =>
  sendSuccess(res, await service.addMember(req.user!.profileId, req.user!.id, memberParamSchema.parse(req.params).teacherId))

export const removeMember = async (req: Request, res: Response) =>
  sendSuccess(res, await service.removeMember(req.user!.profileId, req.user!.id, memberParamSchema.parse(req.params).teacherId))
