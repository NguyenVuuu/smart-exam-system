import { NextFunction, Request, Response } from 'express'
import { examParamsSchema, startExamBodySchema, examAttemptParamsSchema, saveAnswerBodySchema, saveAnswerParamsSchema, sendHeartbeatParamsSchema, recordViolationBodySchema, runCodeParamsSchema, runCodeBodySchema } from '../validators/student-take-exam.validator'
import { toStartExamResponseDto, toGetExamContentResponseDto, toSaveAnswerResponseDto, toSubmitExamResponseDto, toGetAttemptStatusResponseDto, toGetAttemptResultResponseDto, toSendHeartbeatResponseDto, toRecordViolationResponseDto, toRunCodeResponseDto } from '../mappers/student-take-exam.mapper'
import * as takeExamService from '../services/student-take-exam.service'

export async function startExam(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { scheduleId } = examParamsSchema.parse(req.params)
    const { password, webcamConfirmed } = startExamBodySchema.parse(req.body)
    const studentId    = req.user!.profileId

    // Lấy IP thực (xử lý cả trường hợp đứng sau proxy)
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      'unknown'

    const deviceInfo = req.headers['user-agent'] || 'unknown'

    const passwordParam = password ?? undefined

    const result = await takeExamService.startExam(
      scheduleId,
      studentId,
      req.user!.id,
      ipAddress,
      deviceInfo,
      passwordParam,
      webcamConfirmed,
    )

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
    const { scheduleId, attemptId } = examAttemptParamsSchema.parse(req.params)
    const studentId             = req.user!.profileId

    const result = await takeExamService.getExamContent(scheduleId, attemptId, studentId)

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
    const { scheduleId, attemptId } = saveAnswerParamsSchema.parse(req.params)
    const { questionId, answer } = saveAnswerBodySchema.parse(req.body)
    const studentId              = req.user!.profileId

    const result = await takeExamService.saveAnswer(
      scheduleId,
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
    const { scheduleId, attemptId } = examAttemptParamsSchema.parse(req.params)
    const studentId             = req.user!.profileId

    const result = await takeExamService.submitExam(scheduleId, attemptId, studentId)

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
    const { scheduleId, attemptId } = examAttemptParamsSchema.parse(req.params)
    const studentId             = req.user!.profileId

    const result = await takeExamService.getAttemptStatus(scheduleId, attemptId, studentId)

    res.status(200).json({
      success: true,
      message: 'Attempt status loaded successfully',
      data:    toGetAttemptStatusResponseDto(result),
    })
  } catch (err) {
    next(err)
  }
}

export async function getAttemptResult(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { scheduleId, attemptId } = examAttemptParamsSchema.parse(req.params)
    const result = await takeExamService.getAttemptResult(scheduleId, attemptId, req.user!.profileId)
    res.status(200).json({
      success: true,
      message: 'Attempt result loaded successfully',
      data: toGetAttemptResultResponseDto(result),
    })
  } catch (err) {
    next(err)
  }
}


// ─── API 6: Send Heartbeat ───────────────────────────────────────────────────

export async function sendHeartbeat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { scheduleId, attemptId } = sendHeartbeatParamsSchema.parse(req.params)
    const studentId = req.user!.profileId

    const result = await takeExamService.sendHeartbeat(scheduleId, attemptId, studentId)

    res.status(200).json({
      success: true,
      message: 'Heartbeat received',
      data: toSendHeartbeatResponseDto(result),
    })
  } catch (err) {
    next(err)
  }
}

// ─── API 7: Run Code ───────────────────────────────────────────────────────────

export async function recordViolation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { scheduleId, attemptId } = examAttemptParamsSchema.parse(req.params)
    const body = recordViolationBodySchema.parse(req.body)
    const evidenceFiles = Array.isArray(req.files) ? req.files : []
    const result = await takeExamService.recordViolation(scheduleId, attemptId, req.user!.profileId, body, evidenceFiles)

    res.status(201).json({
      success: true,
      message: 'Violation recorded',
      data: toRecordViolationResponseDto(result),
    })
  } catch (err) {
    next(err)
  }
}

export async function runCode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { scheduleId, attemptId, questionId } = runCodeParamsSchema.parse(req.params)
    const { sourceCode } = runCodeBodySchema.parse(req.body)
    const studentId = req.user!.profileId

    const result = await takeExamService.runCode(
      scheduleId,
      attemptId,
      questionId,
      studentId,
      sourceCode,
    )

    const message = result.compilationStatus === 'COMPILE_ERROR' 
      ? 'Compilation failed'
      : 'Code executed successfully'

    res.status(200).json({
      success: true,
      message,
      data: toRunCodeResponseDto(result),
    })
  } catch (err) {
    next(err)
  }
}
