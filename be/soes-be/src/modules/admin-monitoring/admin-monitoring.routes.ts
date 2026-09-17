import { Router } from 'express'
import { asyncHandler } from '../../middlewares/asyncHandler'
import { authenticate } from '../auth/middlewares/authenticate'
import { requireAdmin } from '../auth/middlewares/authorize'
import * as controller from './admin-monitoring.controller'

const router = Router()

router.use(authenticate, requireAdmin())
router.get('/monitoring/proctoring', asyncHandler(controller.proctoring))
router.get('/monitoring/reports', asyncHandler(controller.reports))

export default router
