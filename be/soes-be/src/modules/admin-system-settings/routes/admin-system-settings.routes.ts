import { Router } from 'express'
import { asyncHandler } from '../../../middlewares/asyncHandler'
import { authenticate } from '../../auth/middlewares/authenticate'
import { requireTeacher } from '../../auth/middlewares/authorize'
import { requireBackoffice } from '../../auth/middlewares/requireBackoffice'
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
router.use(authenticate)
router.get('/system-settings', requireBackoffice('SETTINGS_VIEW'), asyncHandler(getSettings))
router.put('/system-settings/general', requireBackoffice('SETTINGS_MANAGE'), asyncHandler(updateGeneral))
router.post('/system-settings/logo', requireBackoffice('SETTINGS_MANAGE'), uploadSystemLogo, asyncHandler(uploadLogo))
router.delete('/system-settings/logo', requireBackoffice('SETTINGS_MANAGE'), asyncHandler(removeLogo))
router.put('/system-settings/exam-defaults', requireBackoffice('SETTINGS_MANAGE'), asyncHandler(updateExamDefaults))
router.put('/system-settings/code-generation', requireBackoffice('SETTINGS_MANAGE'), asyncHandler(updateCodeGeneration))
router.put('/system-settings/ai', requireBackoffice('SETTINGS_MANAGE'), asyncHandler(updateAi))
router.post('/system-settings/reset-defaults', requireBackoffice('SETTINGS_MANAGE'), asyncHandler(resetDefaults))

export default router
