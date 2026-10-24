import { Router } from 'express'
import { asyncHandler } from '../../../middlewares/asyncHandler'
import { authenticate } from '../../auth/middlewares/authenticate'
import { requireBackoffice } from '../../auth/middlewares/requireBackoffice'
import * as controller from '../controllers/backoffice-review-group.controller'

const router = Router()
router.use(authenticate)
router.get('/review-groups', requireBackoffice('REVIEW_GROUP_VIEW'), asyncHandler(controller.list))
router.get('/review-groups/:id', requireBackoffice('REVIEW_GROUP_VIEW'), asyncHandler(controller.get))

export default router
