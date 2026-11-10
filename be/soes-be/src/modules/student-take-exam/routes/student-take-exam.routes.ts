import { Router } from 'express'
import { authenticate } from '../../auth/middlewares/authenticate'
import { requireStudent } from '../../auth/middlewares/authorize'
import { uploadViolationEvidence } from '../middlewares/evidence-upload'
import { requireFaceEntry } from '../middlewares/require-face-entry'
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
  requireFaceEntry,
  takeExamController.saveAnswer,
)

// POST /api/student/exam-schedules/:scheduleId/attempts/:attemptId/submit
router.post(
  '/exam-schedules/:scheduleId/attempts/:attemptId/submit',
  authenticate,
  requireStudent(),
  requireFaceEntry,
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
  requireFaceEntry,
  takeExamController.sendHeartbeat,
)

// POST /api/student/exam-schedules/:scheduleId/attempts/:attemptId/violations
router.post(
  '/exam-schedules/:scheduleId/attempts/:attemptId/violations',
  authenticate,
  requireStudent(),
  requireFaceEntry,
  uploadViolationEvidence,
  takeExamController.recordViolation,
)

// PATCH /api/student/exam-schedules/:scheduleId/attempts/:attemptId/violations/:violationId/end
router.patch(
  '/exam-schedules/:scheduleId/attempts/:attemptId/violations/:violationId/end',
  authenticate,
  requireStudent(),
  requireFaceEntry,
  takeExamController.endViolation,
)

router.get(
  '/exam-schedules/:scheduleId/attempts/:attemptId/live/request',
  authenticate,
  requireStudent(),
  requireFaceEntry,
  takeExamController.getPendingLiveCameraRequest,
)

router.get(
  '/exam-schedules/:scheduleId/attempts/:attemptId/live/:sessionId',
  authenticate,
  requireStudent(),
  requireFaceEntry,
  takeExamController.getStudentLiveSession,
)

router.post(
  '/exam-schedules/:scheduleId/attempts/:attemptId/live/:sessionId/offer',
  authenticate,
  requireStudent(),
  requireFaceEntry,
  takeExamController.submitLiveCameraOffer,
)

router.post(
  '/exam-schedules/:scheduleId/attempts/:attemptId/live/:sessionId/ice-candidates',
  authenticate,
  requireStudent(),
  requireFaceEntry,
  takeExamController.addStudentLiveCandidate,
)

router.get(
  '/exam-schedules/:scheduleId/attempts/:attemptId/live/:sessionId/ice-candidates',
  authenticate,
  requireStudent(),
  requireFaceEntry,
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
  requireFaceEntry,
  takeExamController.runCode,
)

export default router
