import { aiAgentConfig } from '../../../config'
import { AppError } from '../../../errors/AppError'
import { logger } from '../../../lib/logger'
import { getStoredAiSettings } from '../../admin-system-settings/services/ai-settings-reader'
import { z } from 'zod'
import { agentAnswerSchema, examMatrixProposalSchema, practiceDraftSchema, programmingReviewAnswerSchema } from '../validators/ai-agent.validator'

type AgentPath = '/v1/student/insights' | '/v1/student/practice-draft' | '/v1/teacher/insights' | '/v1/teacher/exam-matrix' | '/v1/teacher/question-draft' | '/v1/teacher/programming-review'

async function requestAgent<T extends z.ZodType>(path: AgentPath, payload: unknown, schema: T, timeoutMs = aiAgentConfig.timeoutMs): Promise<z.infer<T>> {
  if (!aiAgentConfig.enabled || !aiAgentConfig.sharedSecret) {
    throw new AppError(503, 'AI assistant is not configured')
  }
  const body = z.record(z.string(), z.unknown()).parse(payload)
  const model = typeof body.model === 'string' ? body.model : (await getStoredAiSettings()).model
  const startedAt = Date.now()
  try {
    const response = await fetch(new URL(path, aiAgentConfig.baseUrl), {
      method: 'POST',
      headers: {
        authorization: `Bearer ${aiAgentConfig.sharedSecret}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ ...body, model }),
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!response.ok) {
      logger.warn('AI agent returned an error', { workflow: path, status: response.status, elapsedMs: Date.now() - startedAt })
      if (response.status === 429) throw new AppError(429, 'AI provider rate limit reached')
      if (response.status === 503) throw new AppError(503, 'AI provider is temporarily unavailable')
      if (response.status === 422 && path === '/v1/student/practice-draft') {
        const error = await response.json().catch(() => null) as { detail?: unknown } | null
        const detail = typeof error?.detail === 'string' ? error.detail : ''
        if (detail === 'Material has no readable text' || detail === 'Material cannot be read') {
          throw new AppError(422, 'AI study material has no readable text')
        }
        throw new AppError(422, 'AI could not create enough verified practice questions')
      }
      throw new AppError(503, 'AI assistant is temporarily unavailable')
    }
    const answer = schema.parse(await response.json())
    logger.info('AI agent request completed', { workflow: path, model, elapsedMs: Date.now() - startedAt })
    return answer
  } catch (error) {
    if (error instanceof AppError) throw error
    logger.warn('AI agent request failed', { workflow: path, elapsedMs: Date.now() - startedAt,
      cause: error instanceof Error ? error.name : 'Unknown' })
    throw new AppError(503, 'AI assistant is temporarily unavailable')
  }
}

export const requestInsightAgent = (path: '/v1/student/insights' | '/v1/teacher/insights', payload: unknown) =>
  requestAgent(path, payload, agentAnswerSchema)

export const requestExamMatrixAgent = (payload: unknown) =>
  requestAgent('/v1/teacher/exam-matrix', payload, examMatrixProposalSchema)

export const requestPracticeDraftAgent = (payload: unknown) =>
  requestAgent('/v1/student/practice-draft', payload, practiceDraftSchema)

export const requestQuestionDraftAgent = (payload: unknown, timeoutMs: number) =>
  requestAgent('/v1/teacher/question-draft', payload, z.record(z.string(), z.unknown()), timeoutMs)

export const requestProgrammingReviewAgent = (payload: unknown) =>
  requestAgent('/v1/teacher/programming-review', payload, programmingReviewAnswerSchema)
