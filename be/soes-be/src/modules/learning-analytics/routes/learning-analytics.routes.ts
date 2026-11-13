import { Router } from 'express'
import { asyncHandler } from '../../../middlewares/asyncHandler'
import { authenticate } from '../../auth/middlewares/authenticate'
import { requireStudent } from '../../auth/middlewares/authorize'
import { getStudentInsights } from '../controllers/learning-analytics.controller'

const router = Router()
router.use(authenticate, requireStudent())
router.get('/learning/insights', asyncHandler(getStudentInsights))
export default router
