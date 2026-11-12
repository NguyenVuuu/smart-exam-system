import { aiAgentConfig } from '../../../config'
import { AppError } from '../../../errors/AppError'
import { logger } from '../../../lib/logger'
import { getStoredAiSettings } from '../../admin-system-settings/services/ai-settings-reader'
import { z } from 'zod'
import { agentAnswerSchema, examMatrixProposalSchema, practiceDraftSchema } from '../validators/ai-agent.validator'

type AgentPath = '/v1/student/insights' | '/v1/student/practice-draft' | '/v1/teacher/insights' | '/v1/teacher/exam-matrix' | '/v1/teacher/question-draft'

async function requestAgent<T extends z.ZodType>(path: AgentPath, payload: unknown, schema: T, timeoutMs = aiAgentConfig.timeoutMs): Promise<z.infer<T>> {
  if (!aiAgentConfig.enabled || !aiAgentConfig.sharedSecret) {
    throw new AppError(503, 'AI assistant is not configured')
  }
  const model = (await getStoredAiSettings()).model
  const startedAt = Date.now()
  try {
    const response = await fetch(new URL(path, aiAgentConfig.baseUrl), {
      method: 'POST',
      headers: {
        authorization: `Bearer ${aiAgentConfig.sharedSecret}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ ...z.record(z.string(), z.unknown()).parse(payload), model }),
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!response.ok) throw new Error(`Agent returned ${response.status}`)
    const answer = schema.parse(await response.json())
    logger.info('AI agent request completed', { workflow: path, model, elapsedMs: Date.now() - startedAt })
    return answer
  } catch {
    logger.warn('AI agent request failed', { workflow: path, elapsedMs: Date.now() - startedAt })
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
