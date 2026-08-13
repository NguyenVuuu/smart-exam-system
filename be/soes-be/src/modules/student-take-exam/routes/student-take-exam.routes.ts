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

export default router
