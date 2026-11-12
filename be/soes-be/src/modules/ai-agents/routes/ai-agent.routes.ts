import { Router } from 'express'
import { asyncHandler } from '../../../middlewares/asyncHandler'
import { authenticate } from '../../auth/middlewares/authenticate'
import { requireStudent, requireTeacher } from '../../auth/middlewares/authorize'
import { studentAsk, studentMaterials, studentPracticeCreate, studentPracticeGet, studentPracticeList, studentPracticeSubmit, teacherAsk, teacherExamMatrix, teacherProgrammingReview } from '../controllers/ai-agent.controller'

export const studentAiAgentRoutes = Router()
studentAiAgentRoutes.use(authenticate, requireStudent())
studentAiAgentRoutes.get('/learning/materials', asyncHandler(studentMaterials))
studentAiAgentRoutes.post('/learning/ask', asyncHandler(studentAsk))
studentAiAgentRoutes.post('/learning/practice', asyncHandler(studentPracticeCreate))
studentAiAgentRoutes.get('/learning/practice', asyncHandler(studentPracticeList))
studentAiAgentRoutes.get('/learning/practice/:practiceSetId', asyncHandler(studentPracticeGet))
studentAiAgentRoutes.post('/learning/practice/:practiceSetId/submit', asyncHandler(studentPracticeSubmit))

export const teacherAiAgentRoutes = Router()
teacherAiAgentRoutes.use(authenticate, requireTeacher())
teacherAiAgentRoutes.post('/learning/schedules/:scheduleId/ask', asyncHandler(teacherAsk))
teacherAiAgentRoutes.post('/exams/agent-matrix', asyncHandler(teacherExamMatrix))
teacherAiAgentRoutes.post('/learning/programming-review', asyncHandler(teacherProgrammingReview))
