import { Router } from 'express'
import { authenticate } from '../../auth/middlewares/authenticate'
import { requireStudent } from '../../auth/middlewares/authorize'
import { asyncHandler } from '../../../middlewares/asyncHandler'
import * as controller from '../controllers/student-portal.controller'

const router = Router()

router.use(authenticate, requireStudent())
router.get('/notifications', asyncHandler(controller.listNotifications))
router.patch('/notifications/read-all', asyncHandler(controller.markAllNotificationsRead))
router.patch('/notifications/:notificationId/read', asyncHandler(controller.markNotificationRead))
router.get('/exam-schedules', asyncHandler(controller.listExamSchedules))
router.get('/scores', asyncHandler(controller.listScores))

export default router
