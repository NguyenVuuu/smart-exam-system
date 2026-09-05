import { Router } from 'express'
import { authenticate } from '../../auth/middlewares/authenticate'
import { requireStudent } from '../../auth/middlewares/authorize'
import { uploadViolationEvidence } from '../middlewares/evidence-upload'
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
  uploadViolationEvidence,
  takeExamController.recordViolation,
)

// PATCH /api/student/exam-schedules/:scheduleId/attempts/:attemptId/violations/:violationId/end
router.patch(
  '/exam-schedules/:scheduleId/attempts/:attemptId/violations/:violationId/end',
  authenticate,
  requireStudent(),
  takeExamController.endViolation,
)

router.get(
  '/exam-schedules/:scheduleId/attempts/:attemptId/live/request',
  authenticate,
  requireStudent(),
  takeExamController.getPendingLiveCameraRequest,
)

router.get(
  '/exam-schedules/:scheduleId/attempts/:attemptId/live/:sessionId',
  authenticate,
  requireStudent(),
  takeExamController.getStudentLiveSession,
)

router.post(
  '/exam-schedules/:scheduleId/attempts/:attemptId/live/:sessionId/offer',
  authenticate,
  requireStudent(),
  takeExamController.submitLiveCameraOffer,
)

router.post(
  '/exam-schedules/:scheduleId/attempts/:attemptId/live/:sessionId/ice-candidates',
  authenticate,
  requireStudent(),
  takeExamController.addStudentLiveCandidate,
)

router.get(
  '/exam-schedules/:scheduleId/attempts/:attemptId/live/:sessionId/ice-candidates',
  authenticate,
  requireStudent(),
  takeExamController.getStudentLiveCandidates,
)

router.delete(
  '/exam-schedules/:scheduleId/attempts/:attemptId/live/:sessionId',
  authenticate,
  requireStudent(),
  takeExamController.endStudentLiveSession,
)

// POST /api/student/exam-schedules/:scheduleId/attempts/:attemptId/questions/:questionId/run
router.post(
  '/exam-schedules/:scheduleId/attempts/:attemptId/questions/:questionId/run',
  authenticate,
  requireStudent(),
  takeExamController.runCode,
)

export default router
