import { NextFunction, Request, Response } from 'express'
import { getSubjectsQuerySchema } from '../validators/student-subjects.validator'
import * as subjectsService from '../services/student-subjects.service'

export async function getSubjects(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query     = getSubjectsQuerySchema.parse(req.query)
    const studentId = req.user!.profileId

    const data = await subjectsService.getStudentSubjects(studentId, query)

    res.status(200).json({
      success: true,
      message: 'Student subjects loaded successfully',
      data,
    })
  } catch (err) {
    next(err)
  }
}
