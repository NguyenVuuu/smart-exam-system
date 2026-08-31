import { Router } from 'express'
import { asyncHandler } from '../../../middlewares/asyncHandler'
import { authenticate } from '../../auth/middlewares/authenticate'
import { requireAdmin } from '../../auth/middlewares/authorize'
import * as controller from '../controllers/exam-schedule.controller'

const router = Router()
router.use(authenticate, requireAdmin())
router.get('/exam-schedules/ready-final-exams', asyncHandler(controller.listReadyExams))
router.get('/exam-schedules', asyncHandler(controller.list))
router.post('/exam-schedules', asyncHandler(controller.create))
router.get('/exam-schedules/:id', asyncHandler(controller.get))
router.put('/exam-schedules/:id', asyncHandler(controller.update))
router.post('/exam-schedules/:id/cancel', asyncHandler(controller.cancel))
export default router
