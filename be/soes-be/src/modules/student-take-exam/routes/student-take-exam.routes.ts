import { Router } from 'express'
import { authenticate } from '../../auth/middlewares/authenticate'
import { requireStudent } from '../../auth/middlewares/authorize'
import * as takeExamController from '../controllers/student-take-exam.controller'

const router = Router()

// POST /api/student/exam-schedules/:scheduleId/start
router.post(
  '/exam-schedules/:scheduleId/start',
  authenticate,
  requireStudent(),
  takeExamController.startExam,
)

// GET /api/student/exam-schedules/:scheduleId/attempts/:attemptId
router.get(
  '/exam-schedules/:scheduleId/attempts/:attemptId',
  authenticate,
  requireStudent(),
  takeExamController.getExamContent,
)

// PUT /api/student/exam-schedules/:scheduleId/attempts/:attemptId/answers
router.put(
  '/exam-schedules/:scheduleId/attempts/:attemptId/answers',
  authenticate,
  requireStudent(),
  takeExamController.saveAnswer,
)

// POST /api/student/exam-schedules/:scheduleId/attempts/:attemptId/submit
router.post(
  '/exam-schedules/:scheduleId/attempts/:attemptId/submit',
  authenticate,
  requireStudent(),
  takeExamController.submitExam,
)

// GET /api/student/exam-schedules/:scheduleId/attempts/:attemptId/status
router.get(
  '/exam-schedules/:scheduleId/attempts/:attemptId/status',
  authenticate,
  requireStudent(),
  takeExamController.getAttemptStatus,
)

router.get(
  '/exam-schedules/:scheduleId/attempts/:attemptId/result',
  authenticate,
  requireStudent(),
  takeExamController.getAttemptResult,
)

// POST /api/student/exam-schedules/:scheduleId/attempts/:attemptId/heartbeat
router.post(
  '/exam-schedules/:scheduleId/attempts/:attemptId/heartbeat',
  authenticate,
  requireStudent(),
  takeExamController.sendHeartbeat,
)

// POST /api/student/exam-schedules/:scheduleId/attempts/:attemptId/violations
router.post(
  '/exam-schedules/:scheduleId/attempts/:attemptId/violations',
  authenticate,
  requireStudent(),
  takeExamController.recordViolation,
)

// POST /api/student/exam-schedules/:scheduleId/attempts/:attemptId/questions/:questionId/run
router.post(
  '/exam-schedules/:scheduleId/attempts/:attemptId/questions/:questionId/run',
  authenticate,
  requireStudent(),
  takeExamController.runCode,
)

export default router
