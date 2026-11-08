import type { NextFunction, Request, Response } from 'express'
import * as service from '../services/student-face.service'
import { idSchema, manualBodySchema, manualParamsSchema, scheduleParamsSchema, startSchema } from '../validators/student-face.validator'

export async function getManualApproval(req: Request, res: Response, next: NextFunction) {
  try {
    const { scheduleId } = scheduleParamsSchema.parse(req.params)
    res.json({ success: true, data: await service.getManualApproval(req.user!.profileId, scheduleId) })
  } catch (error) { next(error) }
}

export async function pendingManualReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const { scheduleId } = scheduleParamsSchema.parse(req.params)
    res.json({ success: true, data: await service.getPendingManualReviews(req.user!.profileId, scheduleId) })
  } catch (error) { next(error) }
}

export async function profile(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, data: await service.getProfile(req.user!.profileId) })
  } catch (error) { next(error) }
}

export async function start(req: Request, res: Response, next: NextFunction) {
  try {
    const { purpose, scheduleId } = startSchema.parse(req.body)
    res.status(201).json({ success: true, data: await service.createSession(req.user!.profileId, purpose, scheduleId) })
  } catch (error) { next(error) }
}

export async function complete(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = idSchema.parse(req.params)
    res.json({ success: true, data: await service.completeSession(req.user!.profileId, id, req.user!.id) })
  } catch (error) { next(error) }
}

export async function approveManual(req: Request, res: Response, next: NextFunction) {
  try {
    const { scheduleId, studentId } = manualParamsSchema.parse(req.params)
    const { reason } = manualBodySchema.parse(req.body)
    const grant = await service.approveManualEntry(req.user!.profileId, req.user!.id, scheduleId, studentId, reason)
    res.status(201).json({ success: true, data: grant })
  } catch (error) { next(error) }
}
