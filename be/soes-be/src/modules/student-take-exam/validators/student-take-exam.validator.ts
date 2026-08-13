import { z } from 'zod'

export const examParamsSchema = z.object({
  examId: z.string().min(1, 'examId is required'),
})

export type ExamParams = z.infer<typeof examParamsSchema>
