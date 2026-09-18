import type { Request, Response } from 'express'
import { sendSuccess as send } from '../../utils/httpResponse'
import * as service from './notifications.service'
import { notificationParamsSchema, notificationsQuerySchema } from './notifications.validator'

export const list = async (req: Request, res: Response) =>
  send(res, await service.list(req.user!.id, notificationsQuerySchema.parse(req.query)))

export const markRead = async (req: Request, res: Response) => {
  const { notificationId } = notificationParamsSchema.parse(req.params)
  send(res, await service.markRead(req.user!.id, notificationId))
}

export const markAllRead = async (req: Request, res: Response) =>
  send(res, await service.markAllRead(req.user!.id))
