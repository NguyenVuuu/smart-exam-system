import type { Request, Response } from 'express'
import { sendSuccess as send } from '../../../utils/httpResponse'
import * as service from '../services/student-portal.service'
import {
  notificationParamsSchema,
  notificationsQuerySchema,
  studentExamSchedulesQuerySchema,
  studentScoresQuerySchema,
} from '../validators/student-portal.validator'

export const listNotifications = async (req: Request, res: Response) =>
  send(res, await service.getNotifications(req.user!.id, notificationsQuerySchema.parse(req.query)))

export const markNotificationRead = async (req: Request, res: Response) => {
  const { notificationId } = notificationParamsSchema.parse(req.params)
  send(res, await service.markNotificationRead(req.user!.id, notificationId))
}

export const markAllNotificationsRead = async (req: Request, res: Response) =>
  send(res, await service.markAllNotificationsRead(req.user!.id))

export const listExamSchedules = async (req: Request, res: Response) =>
  send(res, await service.getExamSchedules(req.user!.profileId, studentExamSchedulesQuerySchema.parse(req.query)))

export const listScores = async (req: Request, res: Response) =>
  send(res, await service.getScores(req.user!.profileId, studentScoresQuerySchema.parse(req.query)))
