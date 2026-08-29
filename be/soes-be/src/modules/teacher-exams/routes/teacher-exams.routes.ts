import { Router } from 'express'
import { asyncHandler } from '../../../middlewares/asyncHandler'
import { authenticate } from '../../auth/middlewares/authenticate'
import { requireTeacher } from '../../auth/middlewares/authorize'
import * as controller from '../controllers/teacher-exams.controller'

const router = Router()
router.use(authenticate, requireTeacher())
router.get('/exams', asyncHandler(controller.list))
router.post('/exams', asyncHandler(controller.create))
router.get('/exams/:id', asyncHandler(controller.get))
router.put('/exams/:id', asyncHandler(controller.update))
router.put('/exams/:id/questions', asyncHandler(controller.replaceQuestions))
router.post('/exams/:id/submit', asyncHandler(controller.submit))
router.post('/exams/:id/copy', asyncHandler(controller.copy))
router.delete('/exams/:id', asyncHandler(controller.remove))
router.get('/exams/:id/schedules', asyncHandler(controller.listSchedules))
router.post('/exams/:id/schedules', asyncHandler(controller.createSchedule))
router.put('/exams/:id/schedules/:scheduleId', asyncHandler(controller.updateSchedule))
router.post('/exams/:id/schedules/:scheduleId/cancel', asyncHandler(controller.cancelSchedule))
router.get('/exam-approvals', asyncHandler(controller.listApprovals))
router.post('/exam-approvals/:id/approve', asyncHandler(controller.approve))
router.post('/exam-approvals/:id/reject', asyncHandler(controller.reject))
router.post('/proctoring/extend-time', asyncHandler(controller.extendTime))
export default router
