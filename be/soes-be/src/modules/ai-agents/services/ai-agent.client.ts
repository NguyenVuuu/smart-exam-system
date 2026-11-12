import { aiAgentConfig } from '../../../config'
import { AppError } from '../../../errors/AppError'
import { logger } from '../../../lib/logger'
import { agentAnswerSchema } from '../validators/ai-agent.validator'

export async function requestAgent(path: '/v1/student/insights' | '/v1/teacher/insights', payload: unknown) {
  if (!aiAgentConfig.enabled || !aiAgentConfig.sharedSecret) {
    throw new AppError(503, 'AI assistant is not configured')
  }
  const startedAt = Date.now()
  try {
    const response = await fetch(new URL(path, aiAgentConfig.baseUrl), {
      method: 'POST',
      headers: {
        authorization: `Bearer ${aiAgentConfig.sharedSecret}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(aiAgentConfig.timeoutMs),
    })
    if (!response.ok) throw new Error(`Agent returned ${response.status}`)
    const answer = agentAnswerSchema.parse(await response.json())
    logger.info('AI agent request completed', { workflow: path, elapsedMs: Date.now() - startedAt })
    return answer
  } catch {
    logger.warn('AI agent request failed', { workflow: path, elapsedMs: Date.now() - startedAt })
    throw new AppError(503, 'AI assistant is temporarily unavailable')
  }
}
