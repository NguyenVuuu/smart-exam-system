import { Router } from 'express'
import { asyncHandler } from '../../../middlewares/asyncHandler'
import { authenticate } from '../../auth/middlewares/authenticate'
import { requireBackoffice } from '../../auth/middlewares/requireBackoffice'
import * as controller from '../controllers/admin-users.controller'

const router = Router()
router.use(authenticate)
router.get('/users/next-code', requireBackoffice('USERS_MANAGE'), asyncHandler(controller.getNextCode))
router.get('/users/references', requireBackoffice('ACADEMIC_VIEW', 'SCHEDULES_VIEW'), asyncHandler(controller.listReferences))
router.get('/users', requireBackoffice('USERS_VIEW'), asyncHandler(controller.listUsers))
router.post('/users', requireBackoffice('USERS_MANAGE'), asyncHandler(controller.createUser))
router.put('/users/:role/:profileId', requireBackoffice('USERS_MANAGE'), asyncHandler(controller.updateUser))
router.patch('/users/:role/:profileId/status', requireBackoffice('USERS_MANAGE'), asyncHandler(controller.setStatus))
router.post('/users/:role/:profileId/reset-password', requireBackoffice('USERS_MANAGE'), asyncHandler(controller.resetPassword))
router.post('/course-offerings/:courseOfferingId/enrollments', requireBackoffice('ACADEMIC_MANAGE'), asyncHandler(controller.enroll))
router.get('/course-offerings/:courseOfferingId/enrollments', requireBackoffice('ACADEMIC_VIEW'), asyncHandler(controller.listEnrollments))
router.delete('/course-offerings/:courseOfferingId/enrollments/:studentId', requireBackoffice('ACADEMIC_MANAGE'), asyncHandler(controller.withdraw))
export default router
