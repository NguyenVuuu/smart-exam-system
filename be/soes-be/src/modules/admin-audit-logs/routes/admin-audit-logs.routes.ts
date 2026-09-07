import { Router } from 'express'
import { asyncHandler } from '../../../middlewares/asyncHandler'
import { authenticate } from '../../auth/middlewares/authenticate'
import { requireAdmin } from '../../auth/middlewares/authorize'
import * as controller from '../controllers/admin-audit-logs.controller'

const router = Router()
router.use(authenticate, requireAdmin())
router.get('/audit-logs', asyncHandler(controller.listAuditLogs))
router.get('/audit-logs/overview', asyncHandler(controller.getAuditLogOverview))
router.get('/audit-logs/export', asyncHandler(controller.exportAuditLogs))
router.get('/audit-logs/:id', asyncHandler(controller.getAuditLog))

export default router
