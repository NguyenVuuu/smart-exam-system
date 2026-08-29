import { Router } from 'express'
import { asyncHandler } from '../../../middlewares/asyncHandler'
import { authenticate } from '../../auth/middlewares/authenticate'
import { requireAdmin } from '../../auth/middlewares/authorize'
import * as controller from '../controllers/admin-users.controller'

const router = Router()
router.use(authenticate, requireAdmin())
router.get('/users', asyncHandler(controller.listUsers))
router.post('/users', asyncHandler(controller.createUser))
router.put('/users/:role/:profileId', asyncHandler(controller.updateUser))
router.patch('/users/:role/:profileId/status', asyncHandler(controller.setStatus))
router.post('/users/:role/:profileId/reset-password', asyncHandler(controller.resetPassword))
router.post('/course-offerings/:courseOfferingId/enrollments', asyncHandler(controller.enroll))
router.delete('/course-offerings/:courseOfferingId/enrollments/:studentId', asyncHandler(controller.withdraw))
export default router
