import { Router } from 'express'
import { asyncHandler } from '../../../middlewares/asyncHandler'
import { authenticate } from '../../auth/middlewares/authenticate'
import { requireBackoffice } from '../../auth/middlewares/requireBackoffice'
import * as controller from '../controllers/exam-schedule.controller'

const router = Router()
router.use(authenticate)
router.get('/exam-schedules/ready-final-exams', requireBackoffice('SCHEDULES_VIEW'), asyncHandler(controller.listReadyExams))
router.get('/exam-schedules', requireBackoffice('SCHEDULES_VIEW'), asyncHandler(controller.list))
router.post('/exam-schedules', requireBackoffice('SCHEDULES_MANAGE'), asyncHandler(controller.create))
router.get('/exam-schedules/:id', requireBackoffice('SCHEDULES_VIEW'), asyncHandler(controller.get))
router.put('/exam-schedules/:id', requireBackoffice('SCHEDULES_MANAGE'), asyncHandler(controller.update))
router.post('/exam-schedules/:id/cancel', requireBackoffice('SCHEDULES_MANAGE'), asyncHandler(controller.cancel))
export default router
