import { Router } from 'express'
import { asyncHandler } from '../../middlewares/asyncHandler'
import { authenticate } from '../auth/middlewares/authenticate'
import { requireBackoffice } from '../auth/middlewares/requireBackoffice'
import * as controller from './admin-monitoring.controller'

const router = Router()

router.use(authenticate)
router.get('/monitoring/proctoring', requireBackoffice('MONITORING_VIEW'), asyncHandler(controller.proctoring))
router.get('/monitoring/reports', requireBackoffice('REPORTS_VIEW'), asyncHandler(controller.reports))

export default router
