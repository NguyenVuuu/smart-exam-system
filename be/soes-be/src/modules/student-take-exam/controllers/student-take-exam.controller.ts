import { NextFunction, Request, Response } from 'express'
import { examParamsSchema } from '../validators/student-take-exam.validator'
import { toStartExamResponseDto } from '../mappers/student-take-exam.mapper'
import * as takeExamService from '../services/student-take-exam.service'

export async function startExam(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { examId } = examParamsSchema.parse(req.params)
    const studentId  = req.user!.profileId

    const result = await takeExamService.startExam(examId, studentId)

    res.status(200).json({
      success: true,
      message: 'Exam started successfully',
      data:    toStartExamResponseDto(result),
    })
  } catch (err) {
    next(err)
  }
}
