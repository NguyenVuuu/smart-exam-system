import { Router } from 'express'
import { asyncHandler } from '../../../middlewares/asyncHandler'
import { authenticate } from '../../auth/middlewares/authenticate'
import { requireBackoffice } from '../../auth/middlewares/requireBackoffice'
import * as controller from '../controllers/admin-content.controller'

const router = Router()
router.use(authenticate)
router.get('/shared-question-bank', requireBackoffice('QUESTION_BANK_VIEW'), asyncHandler(controller.listQuestionBank))
router.get('/shared-question-bank/:id', requireBackoffice('QUESTION_BANK_VIEW'), asyncHandler(controller.getQuestionBankItem))
router.post('/shared-question-bank/:id/remove', requireBackoffice('QUESTION_BANK_MANAGE'), asyncHandler(controller.removeQuestion))
router.post('/shared-question-bank/:id/restore', requireBackoffice('QUESTION_BANK_MANAGE'), asyncHandler(controller.restoreQuestion))
router.get('/exam-tracking', requireBackoffice('EXAMS_VIEW'), asyncHandler(controller.listExams))
router.get('/exam-tracking/:id', requireBackoffice('EXAMS_VIEW'), asyncHandler(controller.getExamDetail))
export default router
