import { Router } from 'express'
import { authenticate } from '../auth/middlewares/authenticate'
import { requireStudent, requireTeacher } from '../auth/middlewares/authorize'
import * as controller from './grade-appeals.controller'

const router = Router()

router.get(
  '/exam-schedules/:scheduleId/attempts/:attemptId/appeals',
  authenticate,
  requireStudent(),
  controller.listStudentAppeals,
)

router.post(
  '/exam-schedules/:scheduleId/attempts/:attemptId/appeals',
  authenticate,
  requireStudent(),
  controller.createStudentAppeal,
)

router.get(
  '/grade-appeals',
  authenticate,
  requireTeacher(),
  controller.listTeacherAppeals,
)

router.get(
  '/grade-appeals/:appealId',
  authenticate,
  requireTeacher(),
  controller.getTeacherAppeal,
)

router.patch(
  '/grade-appeals/:appealId',
  authenticate,
  requireTeacher(),
  controller.updateTeacherAppeal,
)

export default router
