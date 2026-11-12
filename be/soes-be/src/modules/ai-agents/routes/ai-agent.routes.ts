import { Router } from 'express'
import { asyncHandler } from '../../../middlewares/asyncHandler'
import { authenticate } from '../../auth/middlewares/authenticate'
import { requireStudent, requireTeacher } from '../../auth/middlewares/authorize'
import { studentAsk, studentMaterials, teacherAsk, teacherExamMatrix } from '../controllers/ai-agent.controller'

export const studentAiAgentRoutes = Router()
studentAiAgentRoutes.use(authenticate, requireStudent())
studentAiAgentRoutes.get('/learning/materials', asyncHandler(studentMaterials))
studentAiAgentRoutes.post('/learning/ask', asyncHandler(studentAsk))

export const teacherAiAgentRoutes = Router()
teacherAiAgentRoutes.use(authenticate, requireTeacher())
teacherAiAgentRoutes.post('/learning/schedules/:scheduleId/ask', asyncHandler(teacherAsk))
teacherAiAgentRoutes.post('/exams/agent-matrix', asyncHandler(teacherExamMatrix))
