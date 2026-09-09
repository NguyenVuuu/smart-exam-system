import { Router } from 'express'
import { asyncHandler } from '../../../middlewares/asyncHandler'
import { authenticate } from '../../auth/middlewares/authenticate'
import { requireAdmin, requireTeacher } from '../../auth/middlewares/authorize'
import { uploadSystemLogo } from '../../../middlewares/fileUpload'
import {
  getPublicSettings,
  getSettings,
  getTeacherExamDefaults,
  removeLogo,
  resetDefaults,
  updateAi,
  updateCodeGeneration,
  updateExamDefaults,
  updateGeneral,
  uploadLogo,
} from '../controllers/admin-system-settings.controller'

const router = Router()

// Public route for login and student lobby
export const publicSystemSettingsRouter = Router()
publicSystemSettingsRouter.get('/public', asyncHandler(getPublicSettings))

export const teacherSystemSettingsRouter = Router()
teacherSystemSettingsRouter.use(authenticate, requireTeacher())
teacherSystemSettingsRouter.get('/system-settings/exam-defaults', asyncHandler(getTeacherExamDefaults))

// Admin-only management routes
router.use(authenticate, requireAdmin())
router.get('/system-settings', asyncHandler(getSettings))
router.put('/system-settings/general', asyncHandler(updateGeneral))
router.post('/system-settings/logo', uploadSystemLogo, asyncHandler(uploadLogo))
router.delete('/system-settings/logo', asyncHandler(removeLogo))
router.put('/system-settings/exam-defaults', asyncHandler(updateExamDefaults))
router.put('/system-settings/code-generation', asyncHandler(updateCodeGeneration))
router.put('/system-settings/ai', asyncHandler(updateAi))
router.post('/system-settings/reset-defaults', asyncHandler(resetDefaults))

export default router
