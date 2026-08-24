import { NextFunction, Request, Response } from 'express'
import { examParamsSchema, startExamBodySchema, examAttemptParamsSchema, saveAnswerBodySchema, saveAnswerParamsSchema } from '../validators/student-take-exam.validator'
import { toStartExamResponseDto, toGetExamContentResponseDto, toSaveAnswerResponseDto, toSubmitExamResponseDto, toGetAttemptStatusResponseDto } from '../mappers/student-take-exam.mapper'
import * as takeExamService from '../services/student-take-exam.service'

export async function startExam(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { examId }   = examParamsSchema.parse(req.params)
    const { password } = startExamBodySchema.parse(req.body)
    const studentId    = req.user!.profileId

    const result = await takeExamService.startExam(examId, studentId, password)

    res.status(200).json({
      success: true,
      message: 'Exam started successfully',
      data:    toStartExamResponseDto(result),
    })
  } catch (err) {
    next(err)
  }
}

// ─── API 2: Get Exam Content ──────────────────────────────────────────────────

export async function getExamContent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { examId, attemptId } = examAttemptParamsSchema.parse(req.params)
    const studentId             = req.user!.profileId

    const result = await takeExamService.getExamContent(examId, attemptId, studentId)

    res.status(200).json({
      success: true,
      message: 'Exam loaded successfully',
      data:    toGetExamContentResponseDto(result),
    })
  } catch (err) {
    next(err)
  }
}

// ─── API 3: Save Answer ───────────────────────────────────────────────────────

export async function saveAnswer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { examId, attemptId } = saveAnswerParamsSchema.parse(req.params)
    const { questionId, answer } = saveAnswerBodySchema.parse(req.body)
    const studentId              = req.user!.profileId

    const result = await takeExamService.saveAnswer(
      examId,
      attemptId,
      studentId,
      questionId,
      answer,
    )

    res.status(200).json({
      success: true,
      message: 'Answer saved successfully',
      data:    toSaveAnswerResponseDto(result.questionId, result.remainingSeconds),
    })
  } catch (err) {
    next(err)
  }
}


// ─── API 4: Submit Exam ───────────────────────────────────────────────────────

export async function submitExam(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { examId, attemptId } = examAttemptParamsSchema.parse(req.params)
    const studentId             = req.user!.profileId

    const result = await takeExamService.submitExam(examId, attemptId, studentId)

    res.status(200).json({
      success: true,
      message: 'Exam submitted successfully',
      data:    toSubmitExamResponseDto(result),
    })
  } catch (err) {
    next(err)
  }
}

// ─── API 5: Get Attempt Status ────────────────────────────────────────────────

export async function getAttemptStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { examId, attemptId } = examAttemptParamsSchema.parse(req.params)
    const studentId             = req.user!.profileId

    const result = await takeExamService.getAttemptStatus(examId, attemptId, studentId)

    res.status(200).json({
      success: true,
      message: 'Attempt status loaded successfully',
      data:    toGetAttemptStatusResponseDto(result),
    })
  } catch (err) {
    next(err)
  }
}
