import type { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import { faceVerificationConfig } from '../../../config'
import { assertOpenFaceEntry } from '../repositories/attempt.repository'

const paramsSchema = z.object({ scheduleId: z.string().uuid(), attemptId: z.string().uuid() })

export async function requireFaceEntry(req: Request, _res: Response, next: NextFunction) {
  if (!faceVerificationConfig.enabled) return next()
  try {
    const { scheduleId, attemptId } = paramsSchema.parse(req.params)
    const grantId = z.string().uuid().optional().parse(req.get('X-Exam-Face-Grant'))
    await assertOpenFaceEntry(scheduleId, req.user!.profileId, attemptId, grantId)
    next()
  } catch (error) {
    next(error)
  }
}
