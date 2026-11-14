import { Router } from 'express'
import { asyncHandler } from '../../../middlewares/asyncHandler'
import { authenticate } from '../../auth/middlewares/authenticate'
import { requireStudent, requireTeacher } from '../../auth/middlewares/authorize'
import { studentAsk, studentConversationGet, studentConversationList, studentMaterials, studentPracticeCreate, studentPracticeGet, studentPracticeList, studentPracticeRunSample, studentPracticeSubmit, studentReviewExplanation, teacherAsk, teacherConversationGet, teacherConversationList, teacherExamDraft, teacherProgrammingReview, teacherTopicSuggestion } from '../controllers/ai-agent.controller'

export const studentAiAgentRoutes = Router()
studentAiAgentRoutes.use(authenticate, requireStudent())
studentAiAgentRoutes.get('/learning/materials', asyncHandler(studentMaterials))
studentAiAgentRoutes.post('/learning/ask', asyncHandler(studentAsk))
studentAiAgentRoutes.get('/learning/conversations', asyncHandler(studentConversationList))
studentAiAgentRoutes.get('/learning/conversations/:conversationId', asyncHandler(studentConversationGet))
studentAiAgentRoutes.post('/learning/attempts/:attemptId/questions/:questionId/explain', asyncHandler(studentReviewExplanation))
studentAiAgentRoutes.post('/learning/practice', asyncHandler(studentPracticeCreate))
studentAiAgentRoutes.get('/learning/practice', asyncHandler(studentPracticeList))
studentAiAgentRoutes.get('/learning/practice/:practiceSetId', asyncHandler(studentPracticeGet))
studentAiAgentRoutes.post('/learning/practice/:practiceSetId/items/:itemId/run-sample', asyncHandler(studentPracticeRunSample))
studentAiAgentRoutes.post('/learning/practice/:practiceSetId/submit', asyncHandler(studentPracticeSubmit))

export const teacherAiAgentRoutes = Router()
teacherAiAgentRoutes.use(authenticate, requireTeacher())
teacherAiAgentRoutes.post('/learning/schedules/:scheduleId/ask', asyncHandler(teacherAsk))
teacherAiAgentRoutes.get('/learning/schedules/:scheduleId/conversations', asyncHandler(teacherConversationList))
teacherAiAgentRoutes.get('/learning/schedules/:scheduleId/conversations/:conversationId', asyncHandler(teacherConversationGet))
teacherAiAgentRoutes.post('/exams/agent-draft', asyncHandler(teacherExamDraft))
teacherAiAgentRoutes.post('/questions/topic-suggestion', asyncHandler(teacherTopicSuggestion))
teacherAiAgentRoutes.post('/learning/programming-review', asyncHandler(teacherProgrammingReview))
