import { z } from 'zod'

export const askAgentSchema = z.object({ message: z.string().trim().min(1).max(500) })
export const scheduleParamSchema = z.object({ scheduleId: z.string().uuid() })

export const agentAnswerSchema = z.object({
  summary: z.string().max(1500),
  actions: z.array(z.string().max(500)).max(5),
  evidenceIds: z.array(z.string().max(100)).max(20),
  caveat: z.string().max(500).nullable(),
})
