import { Router } from 'express'
import { asyncHandler } from '../../../middlewares/asyncHandler'
import { authenticate } from '../../auth/middlewares/authenticate'
import { requireTeacher } from '../../auth/middlewares/authorize'
import { getTeacherScheduleInsights } from '../controllers/learning-analytics.controller'

const router = Router()
router.use(authenticate, requireTeacher())
router.get('/learning/schedules/:scheduleId/insights', asyncHandler(getTeacherScheduleInsights))
export default router
