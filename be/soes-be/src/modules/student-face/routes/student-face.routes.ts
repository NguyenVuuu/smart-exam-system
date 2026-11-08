import { Router } from 'express'
import { authenticate } from '../../auth/middlewares/authenticate'
import { requireStudent, requireTeacher } from '../../auth/middlewares/authorize'
import * as controller from '../controllers/student-face.controller'

export const studentFaceRoutes = Router()
studentFaceRoutes.use(authenticate, requireStudent())
studentFaceRoutes.get('/face/profile', controller.profile)
studentFaceRoutes.get('/face/schedules/:scheduleId/manual-approval', controller.getManualApproval)
studentFaceRoutes.post('/face/sessions', controller.start)
studentFaceRoutes.post('/face/sessions/:id/complete', controller.complete)

export const teacherFaceRoutes = Router()
teacherFaceRoutes.use(authenticate, requireTeacher())
teacherFaceRoutes.post('/exam-schedules/:scheduleId/students/:studentId/face/manual-approval', controller.approveManual)
