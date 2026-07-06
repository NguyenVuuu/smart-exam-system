import { Router } from 'express'
import { authenticate } from '../../auth/middlewares/authenticate'
import { requireStudent } from '../../auth/middlewares/authorize'
import * as subjectsController from '../controllers/student-subjects.controller'

const router = Router()

router.get('/subjects', authenticate, requireStudent(), subjectsController.getSubjects)

export default router
