import { Router } from 'express'
import { asyncHandler } from '../../../middlewares/asyncHandler'
import { authenticate } from '../../auth/middlewares/authenticate'
import { requireTeacher } from '../../auth/middlewares/authorize'
import * as controller from '../controllers/learning-topics.controller'

const router = Router()
router.use(authenticate, requireTeacher())
router.get('/subjects/:subjectId/learning-topics', asyncHandler(controller.list))
router.post('/subjects/:subjectId/learning-topics', asyncHandler(controller.create))
router.put('/questions/:questionId/learning-topics', asyncHandler(controller.assign))
export default router
