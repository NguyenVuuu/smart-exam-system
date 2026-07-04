import { NextFunction, Request, Response } from 'express'
import * as dashboardService from '../services/student-dashboard.service'

export async function getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user!.profileId
    const userId = req.user!.id

    const data = await dashboardService.getStudentDashboard(studentId, userId)

    res.status(200).json({
      success: true,
      message: 'Dashboard loaded successfully',
      data,
    })
  } catch (err) {
    next(err)
  }
}
