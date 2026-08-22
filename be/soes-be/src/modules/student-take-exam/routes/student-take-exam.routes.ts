import { Router } from 'express'
import { authenticate } from '../../auth/middlewares/authenticate'
import { requireStudent } from '../../auth/middlewares/authorize'
import * as takeExamController from '../controllers/student-take-exam.controller'

const router = Router()

// POST /api/student/exams/:examId/start
router.post(
  '/exams/:examId/start',
  authenticate,
  requireStudent(),
  takeExamController.startExam,
)

// GET /api/student/exams/:examId/attempts/:attemptId
router.get(
  '/exams/:examId/attempts/:attemptId',
  authenticate,
  requireStudent(),
  takeExamController.getExamContent,
)

// PUT /api/student/exams/:examId/attempts/:attemptId/answers
router.put(
  '/exams/:examId/attempts/:attemptId/answers',
  authenticate,
  requireStudent(),
  takeExamController.saveAnswer,
)

// POST /api/student/exams/:examId/attempts/:attemptId/submit
router.post(
  '/exams/:examId/attempts/:attemptId/submit',
  authenticate,
  requireStudent(),
  takeExamController.submitExam,
)

export default router

