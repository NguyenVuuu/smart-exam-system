import type { Request, Response } from 'express'
import { sendSuccess } from '../../../utils/httpResponse'
import * as service from '../services/admin-permissions.service'
import {
  updatePermissionBodySchema,
  updatePermissionParamsSchema,
  updateRolePermissionBodySchema,
  updateRolePermissionParamsSchema,
} from '../validators/admin-permissions.validator'

export async function list(_req: Request, res: Response) {
  sendSuccess(res, await service.listWorkspace())
}

export async function update(req: Request, res: Response) {
  const params = updatePermissionParamsSchema.parse(req.params)
  const body = updatePermissionBodySchema.parse(req.body)
  sendSuccess(res, await service.updateOverride({
    ...params,
    ...body,
    actorUserId: req.user!.id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  }))
}

export function me(req: Request, res: Response) {
  sendSuccess(res, { permissions: req.backofficePermissions ?? [] })
}

export async function updateRole(req: Request, res: Response) {
  const params = updateRolePermissionParamsSchema.parse(req.params)
  const body = updateRolePermissionBodySchema.parse(req.body)
  await service.updateRolePermission({
    ...params,
    ...body,
    actorUserId: req.user!.id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  })
  sendSuccess(res, { role: params.role, permission: params.permission, allowed: body.allowed })
}
