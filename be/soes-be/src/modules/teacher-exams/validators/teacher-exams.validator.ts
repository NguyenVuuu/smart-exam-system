import { z } from 'zod'
import { paginationFields } from '../../../utils/pagination'

const id = z.string().trim().min(1)

export const examsQuerySchema = z.object({
  ...paginationFields, keyword: z.string().trim().max(200).optional(), subjectId: id.optional(), semesterId: id.optional(),
  type: z.enum(['QUIZ', 'MIDTERM', 'FINAL']).optional(),
  status: z.enum(['DRAFT', 'READY', 'LOCKED', 'ARCHIVED']).optional(),
  approvalStatus: z.enum(['NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED']).optional(),
})

export const examBodySchema = z.object({
  title: z.string().trim().min(5).max(250), description: z.string().trim().max(2000).optional().nullable(),
  subjectId: id, semesterId: id, type: z.enum(['QUIZ', 'MIDTERM', 'FINAL']),
  format: z.enum(['OBJECTIVE', 'PROGRAMMING', 'MIXED']),
  creationMethod: z.enum(['MANUAL', 'QUESTION_BANK', 'AI_GENERATED', 'MIXED']).default('MANUAL'),
  defaultDurationMinutes: z.coerce.number().int().min(1).max(1440),
  totalPoints: z.coerce.number().positive().max(1000),
  sections: z.array(z.object({
    id: id, title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(500).optional().nullable(),
    type: z.enum(['OBJECTIVE', 'PROGRAMMING']),
    targetPoints: z.coerce.number().positive().max(1000),
    orderIndex: z.coerce.number().int().positive(),
  })).min(1).max(20),
}).superRefine((data, context) => {
  if (new Set(data.sections.map(({ id }) => id)).size !== data.sections.length) {
    context.addIssue({ code: 'custom', path: ['sections'], message: 'Section IDs must be unique' })
  }
  if (new Set(data.sections.map(({ orderIndex }) => orderIndex)).size !== data.sections.length) {
    context.addIssue({ code: 'custom', path: ['sections'], message: 'Section order must be unique' })
  }
  const sectionPoints = data.sections.reduce((sum, section) => sum + section.targetPoints, 0)
  if (Math.abs(sectionPoints - data.totalPoints) > 0.001) {
    context.addIssue({ code: 'custom', path: ['sections'], message: 'Section points must equal exam total points' })
  }
})

const examQuestionPlacementSchema = z.object({
  sectionId: id.optional(),
  points: z.coerce.number().positive().max(1000),
})

const inlineExamQuestionSchema = z.object({
  title: z.string().trim().min(1).max(1000),
  content: z.string().trim().min(1),
  explanation: z.string().trim().optional().nullable(),
  type: z.enum(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'PROGRAMMING']),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  language: z.enum(['JAVA', 'C', 'CPP']).optional().nullable(),
  options: z.array(z.object({ content: z.string().trim().min(1), isCorrect: z.boolean() })).max(20).default([]),
  programmingConfig: z.object({
    timeLimitMs: z.coerce.number().int().min(100).max(60000),
    memoryLimitMb: z.coerce.number().int().min(16).max(2048),
    maxCodeSizeKb: z.coerce.number().int().min(1).max(1024),
  }).optional().nullable(),
  testCases: z.array(z.object({
    input: z.string(), expectedOutput: z.string(), isHidden: z.boolean(),
  })).max(100).default([]),
}).superRefine((question, context) => {
  if (question.type === 'PROGRAMMING') {
    if (!question.language || !question.programmingConfig || question.testCases.length === 0) {
      context.addIssue({ code: 'custom', message: 'Programming questions require a language, configuration, and test cases' })
    }
    return
  }
  if (question.options.length < 2) {
    context.addIssue({ code: 'custom', path: ['options'], message: 'Objective questions require at least two options' })
    return
  }
  const correctCount = question.options.filter(({ isCorrect }) => isCorrect).length
  if (question.type === 'MULTIPLE_CHOICE' ? correctCount < 1 : correctCount !== 1) {
    context.addIssue({
      code: 'custom', path: ['options'],
      message: question.type === 'MULTIPLE_CHOICE'
        ? 'Multiple-choice questions require at least one correct option'
        : 'Single-choice and true/false questions require exactly one correct option',
    })
  }
})

const bankExamQuestionSchema = examQuestionPlacementSchema.extend({
  source: z.literal('QUESTION_BANK'), questionId: id,
})
const inlineExamQuestionPlacementSchema = examQuestionPlacementSchema.extend({
  source: z.literal('INLINE'), question: inlineExamQuestionSchema,
})

export const examQuestionsSchema = z.object({
  items: z.array(z.discriminatedUnion('source', [bankExamQuestionSchema, inlineExamQuestionPlacementSchema])).min(1).max(500),
})

export const autoGenerateExamSchema = z.object({
  title: z.string().trim().min(5).max(250),
  description: z.string().trim().max(2000).optional().nullable(),
  subjectId: id,
  semesterId: id,
  type: z.enum(['QUIZ', 'MIDTERM', 'FINAL']),
  format: z.enum(['OBJECTIVE', 'PROGRAMMING', 'MIXED']).default('OBJECTIVE'),
  defaultDurationMinutes: z.coerce.number().int().min(1).max(1440),
  totalPoints: z.coerce.number().positive().max(1000),
  pickMode: z.enum(['AUTO', 'MANUAL']),
  sourceScope: z.enum(['PERSONAL', 'SHARED', 'BOTH']).default('BOTH'),
  matrix: z.object({
    easy: z.coerce.number().int().min(0).max(500),
    medium: z.coerce.number().int().min(0).max(500),
    hard: z.coerce.number().int().min(0).max(500),
  }),
  selectedQuestionIds: z.array(id).max(500).default([]),
}).superRefine((data, context) => {
  const requestedCount = data.matrix.easy + data.matrix.medium + data.matrix.hard
  if (data.pickMode === 'AUTO' && requestedCount === 0) {
    context.addIssue({ code: 'custom', path: ['matrix'], message: 'Auto generation requires at least one question' })
  }
  if (data.pickMode === 'MANUAL' && data.selectedQuestionIds.length === 0) {
    context.addIssue({ code: 'custom', path: ['selectedQuestionIds'], message: 'Manual generation requires selected questions' })
  }
  if (new Set(data.selectedQuestionIds).size !== data.selectedQuestionIds.length) {
    context.addIssue({ code: 'custom', path: ['selectedQuestionIds'], message: 'Selected questions must be unique' })
  }
})

export const examApprovalQuerySchema = z.object({
  ...paginationFields, keyword: z.string().trim().max(200).optional(), subjectId: id.optional(), semesterId: id.optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).default('PENDING'),
})

export const examRejectionSchema = z.object({ reason: z.string().trim().min(5).max(1000) })
export const extendTimeBodySchema = z.object({
  attemptId: z.string().trim().min(1),
  extraMinutes: z.coerce.number().int().min(1).max(180),
  reason: z.string().trim().min(3).max(500),
})

export type ExamsQuery = z.infer<typeof examsQuerySchema>
export type ExamBody = z.infer<typeof examBodySchema>
export type ExamQuestionInput = z.infer<typeof examQuestionsSchema>['items'][number]
export type AutoGenerateExamBody = z.infer<typeof autoGenerateExamSchema>
export type ExamApprovalQuery = z.infer<typeof examApprovalQuerySchema>
export type ExtendTimeBody = z.infer<typeof extendTimeBodySchema>
