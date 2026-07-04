import { Router } from 'express'
import { authenticate } from '../../auth/middlewares/authenticate'
import { requireStudent } from '../../auth/middlewares/authorize'
import * as dashboardController from '../controllers/student-dashboard.controller'

const router = Router()

router.get('/dashboard', authenticate, requireStudent(), dashboardController.getDashboard)

export default router
