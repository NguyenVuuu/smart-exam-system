import { Router } from 'express'
import { asyncHandler } from '../../../middlewares/asyncHandler'
import { authenticate } from '../../auth/middlewares/authenticate'
import { requireAdmin } from '../../auth/middlewares/authorize'
import { requireBackoffice } from '../../auth/middlewares/requireBackoffice'
import * as controller from '../controllers/admin-permissions.controller'

const router = Router()

router.get('/permissions/me', authenticate, requireBackoffice(), controller.me)
router.get('/permissions', authenticate, requireBackoffice(), requireAdmin(), asyncHandler(controller.list))
router.put('/permissions/accounts/:adminId/:permission', authenticate, requireBackoffice(), requireAdmin(), asyncHandler(controller.update))
router.put('/permissions/roles/:role/:permission', authenticate, requireBackoffice(), requireAdmin(), asyncHandler(controller.updateRole))

export default router
