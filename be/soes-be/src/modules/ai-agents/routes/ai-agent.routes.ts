import { Router } from 'express'
import { asyncHandler } from '../../../middlewares/asyncHandler'
import { authenticate } from '../../auth/middlewares/authenticate'
import { requireStudent, requireTeacher } from '../../auth/middlewares/authorize'
import { studentAsk, teacherAsk } from '../controllers/ai-agent.controller'

export const studentAiAgentRoutes = Router()
studentAiAgentRoutes.use(authenticate, requireStudent())
studentAiAgentRoutes.post('/learning/ask', asyncHandler(studentAsk))

export const teacherAiAgentRoutes = Router()
teacherAiAgentRoutes.use(authenticate, requireTeacher())
teacherAiAgentRoutes.post('/learning/schedules/:scheduleId/ask', asyncHandler(teacherAsk))
