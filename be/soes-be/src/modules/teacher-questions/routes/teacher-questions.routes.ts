import { Router } from 'express'
import { asyncHandler } from '../../../middlewares/asyncHandler'
import { authenticate } from '../../auth/middlewares/authenticate'
import { requireTeacher } from '../../auth/middlewares/authorize'
import * as controller from '../controllers/teacher-questions.controller'

const router = Router()
router.use(authenticate, requireTeacher())
router.get('/questions', asyncHandler(controller.listQuestions))
router.get('/question-subjects', asyncHandler(controller.listSubjects))
router.post('/questions', asyncHandler(controller.createQuestion))
router.put('/questions/:id', asyncHandler(controller.updateQuestion))
router.post('/questions/:id/share', asyncHandler(controller.shareQuestion))
router.post('/questions/:id/archive', asyncHandler(controller.archiveQuestion))
router.post('/questions/:id/restore', asyncHandler(controller.restoreQuestion))
router.get('/question-approvals', asyncHandler(controller.listApprovals))
router.post('/question-approvals/:id/approve', asyncHandler(controller.approve))
router.post('/question-approvals/:id/reject', asyncHandler(controller.reject))
router.post('/question-approvals/:id/remove', asyncHandler(controller.remove))
export default router
