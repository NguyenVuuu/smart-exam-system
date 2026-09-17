import type { Request, Response } from 'express'
import { sendSuccess } from '../../utils/httpResponse'
import { getAdminProctoringOverview, getAdminReportsOverview } from './admin-monitoring.service'

export async function proctoring(_req: Request, res: Response) {
  sendSuccess(res, await getAdminProctoringOverview())
}

export async function reports(_req: Request, res: Response) {
  sendSuccess(res, await getAdminReportsOverview())
}
