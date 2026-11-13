import type { Request, Response } from 'express'
import { sendSuccess as send } from '../../../utils/httpResponse'
import { askStudent, askTeacher, studentConversation, studentConversations, teacherConversation, teacherConversations } from '../services/ai-agent.service'
import { proposeExamDraft } from '../services/exam-draft.service'
import { suggestQuestionTopic } from '../services/topic-suggestion.service'
import { askAgentSchema, conversationParamSchema, conversationQuerySchema, createPracticeSchema, examDraftRequestSchema, practiceParamSchema, programmingReviewSchema, reviewExplanationParamsSchema, reviewExplanationSchema, scheduleParamSchema, submitPracticeSchema, topicSuggestionRequestSchema } from '../validators/ai-agent.validator'
import { getStudentMaterials } from '../services/student-material.service'
import { createStudentPractice, getStudentPractice, listStudentPractice, submitStudentPractice } from '../services/student-practice.service'
import { reviewProgrammingSubmission } from '../services/programming-review.service'
import { explainStudentReviewQuestion } from '../services/student-review-explanation.service'

export const studentAsk = async (req: Request, res: Response) => {
  const { message, materialId, conversationId } = askAgentSchema.parse(req.body)
  return send(res, await askStudent(req.user!.profileId, req.user!.id, message, materialId, conversationId))
}

export const studentConversationList = async (req: Request, res: Response) => send(res,
  await studentConversations(req.user!.profileId, req.user!.id, conversationQuerySchema.parse(req.query).materialId))
export const studentConversationGet = async (req: Request, res: Response) => send(res,
  await studentConversation(req.user!.profileId, req.user!.id,
    conversationParamSchema.parse(req.params).conversationId, conversationQuerySchema.parse(req.query).materialId))

export const studentMaterials = async (req: Request, res: Response) =>
  send(res, await getStudentMaterials(req.user!.profileId))

export const studentReviewExplanation = async (req: Request, res: Response) => {
  const { attemptId, questionId } = reviewExplanationParamsSchema.parse(req.params)
  const { scheduleId, message } = reviewExplanationSchema.parse(req.body)
  return send(res, await explainStudentReviewQuestion(
    req.user!.profileId, req.user!.id, scheduleId, attemptId, questionId, message,
  ))
}

export const studentPracticeCreate = async (req: Request, res: Response) =>
  send(res, await createStudentPractice(req.user!.profileId, req.user!.id, createPracticeSchema.parse(req.body)))

export const studentPracticeList = async (req: Request, res: Response) =>
  send(res, await listStudentPractice(req.user!.profileId))

export const studentPracticeGet = async (req: Request, res: Response) =>
  send(res, await getStudentPractice(req.user!.profileId, practiceParamSchema.parse(req.params).practiceSetId))

export const studentPracticeSubmit = async (req: Request, res: Response) =>
  send(res, await submitStudentPractice(req.user!.profileId,
    practiceParamSchema.parse(req.params).practiceSetId, submitPracticeSchema.parse(req.body)))

export const teacherAsk = async (req: Request, res: Response) => {
  const { message, conversationId } = askAgentSchema.parse(req.body)
  return send(res, await askTeacher(req.user!.profileId, req.user!.id,
    scheduleParamSchema.parse(req.params).scheduleId, message, conversationId))
}

export const teacherConversationList = async (req: Request, res: Response) => send(res,
  await teacherConversations(req.user!.profileId, req.user!.id, scheduleParamSchema.parse(req.params).scheduleId))
export const teacherConversationGet = async (req: Request, res: Response) => send(res,
  await teacherConversation(req.user!.profileId, req.user!.id, scheduleParamSchema.parse(req.params).scheduleId,
    conversationParamSchema.parse(req.params).conversationId))

export const teacherExamDraft = async (req: Request, res: Response) => send(
  res, await proposeExamDraft(req.user!.profileId, req.user!.id, examDraftRequestSchema.parse(req.body)),
)

export const teacherTopicSuggestion = async (req: Request, res: Response) => send(
  res, await suggestQuestionTopic(req.user!.profileId, req.user!.id, topicSuggestionRequestSchema.parse(req.body)),
)

export const teacherProgrammingReview = async (req: Request, res: Response) => {
  const { attemptId, examQuestionId } = programmingReviewSchema.parse(req.body)
  return send(res, await reviewProgrammingSubmission(req.user!.profileId, req.user!.id, attemptId, examQuestionId))
}
