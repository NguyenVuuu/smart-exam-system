import { Router } from 'express'
import { asyncHandler } from '../../../middlewares/asyncHandler'
import { authenticate } from '../../auth/middlewares/authenticate'
import { requireAdmin } from '../../auth/middlewares/authorize'
import * as controller from '../controllers/admin-content.controller'

const router = Router()
router.use(authenticate, requireAdmin())
router.get('/shared-question-bank', asyncHandler(controller.listQuestionBank))
router.get('/shared-question-bank/:id', asyncHandler(controller.getQuestionBankItem))
router.post('/shared-question-bank/:id/remove', asyncHandler(controller.removeQuestion))
router.post('/shared-question-bank/:id/restore', asyncHandler(controller.restoreQuestion))
router.get('/exam-tracking', asyncHandler(controller.listExams))
export default router
