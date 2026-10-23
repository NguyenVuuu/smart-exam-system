import { Router } from 'express'
import { asyncHandler } from '../../../middlewares/asyncHandler'
import { authenticate } from '../../auth/middlewares/authenticate'
import { requireBackoffice } from '../../auth/middlewares/requireBackoffice'
import * as controller from '../controllers/admin-audit-logs.controller'

const router = Router()
router.get('/audit-logs', authenticate, requireBackoffice('AUDIT_VIEW'), asyncHandler(controller.listAuditLogs))
router.get('/audit-logs/overview', authenticate, requireBackoffice('AUDIT_VIEW'), asyncHandler(controller.getAuditLogOverview))
router.get('/audit-logs/export', authenticate, requireBackoffice('AUDIT_VIEW'), asyncHandler(controller.exportAuditLogs))
router.get('/audit-logs/:id', authenticate, requireBackoffice('AUDIT_VIEW'), asyncHandler(controller.getAuditLog))

export default router
