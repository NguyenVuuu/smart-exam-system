import { Router } from 'express'
import { asyncHandler } from '../../../middlewares/asyncHandler'
import { authenticate } from '../../auth/middlewares/authenticate'
import { requireBackoffice } from '../../auth/middlewares/requireBackoffice'
import * as controller from '../controllers/backoffice-review-group.controller'

const router = Router()
router.use(authenticate)
router.get('/review-groups', requireBackoffice('REVIEW_GROUP_VIEW'), asyncHandler(controller.list))
router.get('/review-groups/departments', requireBackoffice('REVIEW_GROUP_VIEW'), asyncHandler(controller.listDepartments))
router.get('/review-groups/:id', requireBackoffice('REVIEW_GROUP_VIEW'), asyncHandler(controller.get))
router.post('/review-groups', requireBackoffice('REVIEW_GROUP_MANAGE_ALL'), asyncHandler(controller.create))
router.patch('/review-groups/:id', requireBackoffice('REVIEW_GROUP_MANAGE_ALL'), asyncHandler(controller.rename))
router.patch('/review-groups/:id/status', requireBackoffice('REVIEW_GROUP_MANAGE_ALL'), asyncHandler(controller.setStatus))
router.get('/review-groups/:id/candidates', requireBackoffice('REVIEW_GROUP_MANAGE_ALL'), asyncHandler(controller.candidates))
router.put('/review-groups/:id/members/:teacherId', requireBackoffice('REVIEW_GROUP_MANAGE_ALL'), asyncHandler(controller.addMember))
router.delete('/review-groups/:id/members/:teacherId', requireBackoffice('REVIEW_GROUP_MANAGE_ALL'), asyncHandler(controller.removeMember))

export default router
