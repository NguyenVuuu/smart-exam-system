import { z } from 'zod'
import { paginationFields } from '../../../utils/pagination'

const id = z.string().trim().min(1)
const optionSchema = z.object({ content: z.string().trim().min(1).max(1000), isCorrect: z.boolean() })
const testCaseSchema = z.object({
  input: z.string().max(20000), expectedOutput: z.string().max(20000),
  weight: z.coerce.number().positive().max(1000), isHidden: z.boolean().default(false),
})

export const questionsQuerySchema = z.object({
  ...paginationFields,
  scope: z.enum(['PERSONAL', 'SHARED']).default('PERSONAL'),
  keyword: z.string().trim().max(200).optional(), subjectId: id.optional(),
  type: z.enum(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'PROGRAMMING']).optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  approvalStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  archived: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
})

export const questionBodySchema = z.object({
  subjectId: id,
  content: z.string().trim().min(5).max(10000),
  explanation: z.string().trim().max(5000).optional().nullable(),
  type: z.enum(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'PROGRAMMING']),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  language: z.enum(['JAVA', 'C', 'CPP']).optional().nullable(),
  options: z.array(optionSchema).max(20).default([]),
  timeLimitMs: z.coerce.number().int().min(100).max(60000).optional(),
  memoryLimitMb: z.coerce.number().int().min(16).max(2048).optional(),
  maxCodeSizeKb: z.coerce.number().int().min(1).max(1024).optional(),
  testCases: z.array(testCaseSchema).max(100).default([]),
})

export const approvalQuerySchema = z.object({
  ...paginationFields, keyword: z.string().trim().max(200).optional(), subjectId: id.optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).default('PENDING'),
})

export const rejectionSchema = z.object({ reason: z.string().trim().min(5).max(1000) })
export const removalSchema = rejectionSchema

export type QuestionsQuery = z.infer<typeof questionsQuerySchema>
export type QuestionBody = z.infer<typeof questionBodySchema>
export type ApprovalQuery = z.infer<typeof approvalQuerySchema>
