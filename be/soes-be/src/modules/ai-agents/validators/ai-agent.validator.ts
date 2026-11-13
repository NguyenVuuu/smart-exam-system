import { z } from 'zod'

const subjectIdSchema = z.string().trim().min(1).max(100)

export const askAgentSchema = z.object({
  message: z.string().trim().min(1).max(500),
  materialId: z.string().uuid().optional(),
  conversationId: z.string().uuid().optional(),
})
export const conversationQuerySchema = z.object({ materialId: z.string().uuid().optional() })
export const conversationParamSchema = z.object({ conversationId: z.string().uuid() })
export const scheduleParamSchema = z.object({ scheduleId: z.string().uuid() })
export const reviewExplanationParamsSchema = z.object({
  attemptId: z.string().uuid(), questionId: z.string().uuid(),
})
export const reviewExplanationSchema = z.object({
  scheduleId: z.string().uuid(), message: z.string().trim().min(1).max(500),
})
export const programmingReviewSchema = z.object({
  attemptId: z.string().uuid(), examQuestionId: z.string().uuid(),
})

export const programmingReviewAnswerSchema = z.object({
  summary: z.string().min(1).max(800),
  suggestions: z.array(z.string().min(1).max(400)).max(4),
  caveat: z.string().min(1).max(300),
})

export const agentAnswerSchema = z.object({
  summary: z.string().max(1500),
  actions: z.array(z.string().max(500)).max(5),
  evidenceIds: z.array(z.string().max(100)).max(20),
  caveat: z.string().max(500).nullable(),
})

export const examDraftRequestSchema = z.object({
  subjectId: subjectIdSchema,
  format: z.enum(['OBJECTIVE', 'PROGRAMMING', 'MIXED']),
  desiredCount: z.number().int().min(1).max(100),
  message: z.string().trim().min(1).max(1000),
  topicTargets: z.array(z.object({ topicId: z.string().uuid(), count: z.number().int().min(1).max(100) }))
    .max(30).default([]),
}).refine((input) => new Set(input.topicTargets.map((item) => item.topicId)).size === input.topicTargets.length,
  { path: ['topicTargets'], message: 'Topic targets must be unique' })

export const examDraftProposalSchema = z.object({
  questionIds: z.array(z.string().uuid()).min(1).max(100),
  rationale: z.string().min(1).max(600),
})

export const topicSuggestionRequestSchema = z.object({
  questionId: z.string().uuid().optional(),
  subjectId: subjectIdSchema,
  title: z.string().trim().min(1).max(300),
  content: z.string().trim().min(1).max(3000),
})

export const topicSuggestionSchema = z.object({
  existingCodes: z.array(z.string().max(50)).max(3),
  newCode: z.string().max(50).nullable(),
  newName: z.string().max(150).nullable(),
  rationale: z.string().max(400),
})

export const practiceDraftSchema = z.object({ questions: z.array(z.object({
  stem: z.string().min(10).max(1000),
  options: z.array(z.string().min(1).max(300)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(10).max(500),
  supportQuote: z.string().min(10).max(300),
  sourceLocation: z.string().max(100).nullable().optional(),
})).min(1).max(20) })

export const programmingPracticeQuestionSchema = z.object({
  stem: z.string().min(80).max(2000),
  language: z.enum(['C', 'CPP', 'JAVA']),
  starterCode: z.string().max(2000),
  referenceSolution: z.string().min(20).max(10000),
  testCases: z.array(z.object({ input: z.string().max(1000), expectedOutput: z.string().min(1).max(1000) })).min(2).max(3),
  explanation: z.string().min(70).max(1000),
  supportQuote: z.string().min(10).max(300),
  sourceLocation: z.string().max(100).nullable().optional(),
})
export const programmingPracticeDraftSchema = z.object({ questions: z.array(programmingPracticeQuestionSchema).min(1).max(20) })

export const createPracticeSchema = z.object({
  materialId: z.string().uuid(), count: z.number().int().min(1).max(20).default(5),
  focusTopicId: z.string().uuid().optional(),
  instruction: z.string().trim().max(500).optional(),
})

export const practiceParamSchema = z.object({ practiceSetId: z.string().uuid() })
export const submitPracticeSchema = z.object({ answers: z.array(z.union([
  z.object({ itemId: z.string().uuid(), selectedIndex: z.number().int().min(0).max(3) }),
  z.object({ itemId: z.string().uuid(), sourceCode: z.string().min(1).max(20000) }),
])).min(1).max(20) })
