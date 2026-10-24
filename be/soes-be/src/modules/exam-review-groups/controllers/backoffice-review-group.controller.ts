import type { Request, Response } from 'express'
import { z } from 'zod'
import { sendSuccess } from '../../../utils/httpResponse'
import * as service from '../services/backoffice-review-group.service'
import * as management from '../services/backoffice-review-group-management.service'
import { createGroupBody, groupIdParams, memberIdParams, renameGroupBody, setGroupStatusBody, supportReasonBody } from '../validators/backoffice-review-group.validator'

const idParams = z.object({ id: z.string().uuid() })

export const list = async (_req: Request, res: Response) => sendSuccess(res, await service.list())
export const listDepartments = async (_req: Request, res: Response) => sendSuccess(res, await service.listDepartments())
export const get = async (req: Request, res: Response) => sendSuccess(res, await service.get(idParams.parse(req.params).id))
export const create = async (req: Request, res: Response) => {
  const body = createGroupBody.parse(req.body)
  return sendSuccess(res, await management.create(req.user!.profileId, req.user!.id, body.departmentId, body.name, body.reason), 201)
}
export const rename = async (req: Request, res: Response) => {
  const body = renameGroupBody.parse(req.body)
  return sendSuccess(res, await management.rename(req.user!.profileId, req.user!.id, groupIdParams.parse(req.params).id, body.name, body.reason))
}
export const setStatus = async (req: Request, res: Response) => {
  const body = setGroupStatusBody.parse(req.body)
  return sendSuccess(res, await management.setStatus(req.user!.profileId, req.user!.id, groupIdParams.parse(req.params).id, body.status, body.reason))
}
export const candidates = async (req: Request, res: Response) => sendSuccess(res, await management.candidates(req.user!.profileId, req.user!.id, groupIdParams.parse(req.params).id))
export const addMember = async (req: Request, res: Response) => {
  const { id, teacherId } = memberIdParams.parse(req.params)
  return sendSuccess(res, await management.addMember(req.user!.profileId, req.user!.id, id, teacherId, supportReasonBody.parse(req.body).reason))
}
export const removeMember = async (req: Request, res: Response) => {
  const { id, teacherId } = memberIdParams.parse(req.params)
  return sendSuccess(res, await management.removeMember(req.user!.profileId, req.user!.id, id, teacherId, supportReasonBody.parse(req.body).reason))
}
