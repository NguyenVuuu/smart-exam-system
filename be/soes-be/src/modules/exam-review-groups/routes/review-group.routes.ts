import { Router } from 'express'
import { asyncHandler } from '../../../middlewares/asyncHandler'
import { authenticate } from '../../auth/middlewares/authenticate'
import { requireTeacher } from '../../auth/middlewares/authorize'
import * as controller from '../controllers/review-group.controller'

const router = Router()
router.use(authenticate, requireTeacher())
router.get('/review-group', asyncHandler(controller.get))
router.post('/review-group', asyncHandler(controller.create))
router.patch('/review-group', asyncHandler(controller.rename))
router.patch('/review-group/status', asyncHandler(controller.setStatus))
router.get('/review-group/candidates', asyncHandler(controller.listCandidates))
router.put('/review-group/members/:teacherId', asyncHandler(controller.addMember))
router.delete('/review-group/members/:teacherId', asyncHandler(controller.removeMember))

export default router
