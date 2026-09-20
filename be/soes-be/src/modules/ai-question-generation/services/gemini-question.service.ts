import { requireGemini } from '../../../lib/gemini'
import { logger } from '../../../lib/logger'
import { ValidationError } from '../../../errors/AppError'
import type { GeneratedQuestion } from '../schemas/generated-question.schema'
import { buildGenerationResponseSchema, type GenerationRequirements } from '../schemas/generation-requirements'
import { generationSystemInstruction } from '../prompts/question-generation.prompt'
import { buildCorrectionPrompt } from '../prompts/question-correction.prompt'
import type { AiInputContent } from './document-reader.service'
import { mergeCorrections, reviewError, reviewGeneratedResponse, type GenerationReview } from './generated-response.review'
import type { ReportGenerationProgress } from './generation-progress'
import { describeValidationError, geminiErrorDiagnostics, toGeminiError } from './gemini-generation.errors'
import { generationThinkingConfig, generationTokenLimit } from './gemini-generation.config'

interface GeminiGenerationRequest extends GenerationRequirements {
  contents: AiInputContent[]
  prompt: string
  model: string
  timeoutMs: number
  onProgress?: ReportGenerationProgress
}

export async function generateWithGemini(request: GeminiGenerationRequest) {
  const startedAt = Date.now()
  const deadline = startedAt + request.timeoutMs
  const signal = AbortSignal.timeout(request.timeoutMs)
  const parts = request.contents.map(content => content.type === 'text'
    ? { text: content.text }
    : { inlineData: { data: content.data, mimeType: content.mime_type } })
  let currentRequest: GenerationRequirements = request
  let previousReview: GenerationReview | undefined
  let validationReason = ''

  try {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const remainingMs = deadline - Date.now()
      if (remainingMs <= 0 || signal.aborted) throw new DOMException('AI generation timeout', 'TimeoutError')
      const attemptStartedAt = Date.now()
      request.onProgress?.({ stage: attempt === 0 ? 'GENERATING' : 'CORRECTING',
        completedCount: previousReview?.slots.filter(Boolean).length ?? 0,
        requestedCount: request.extraction ? previousReview?.slots.length : request.questionCount })
      const response = await requireGemini().models.generateContent({
        model: request.model,
        contents: [...parts, { text: attempt === 0 ? request.prompt
          : buildCorrectionPrompt(request.prompt, previousReview, validationReason) }],
        config: {
          systemInstruction: generationSystemInstruction,
          responseMimeType: 'application/json',
          responseJsonSchema: buildGenerationResponseSchema(currentRequest),
          maxOutputTokens: generationTokenLimit(currentRequest),
          thinkingConfig: generationThinkingConfig(request.model),
          abortSignal: signal,
          httpOptions: { timeout: remainingMs, retryOptions: { attempts: 1 } },
        },
      })
      if (signal.aborted || Date.now() >= deadline) throw new DOMException('AI generation timeout', 'TimeoutError')
      logger.info('AI generation response received', {
        model: request.model, attempt: attempt + 1, elapsedMs: Date.now() - startedAt,
        attemptElapsedMs: Date.now() - attemptStartedAt,
        requestedCount: currentRequest.questionCount, difficulty: request.difficulty,
        finishReason: response.candidates?.[0]?.finishReason,
        outputTokens: response.usageMetadata?.candidatesTokenCount,
        inputTokens: response.usageMetadata?.promptTokenCount,
      })
      // An incomplete response cannot be repaired by repeating the same token-limited request.
      if (response.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
        throw new ValidationError('AI đã đạt giới hạn đầu ra. Vui lòng giảm số câu mỗi lần sinh.')
      }
      try {
        request.onProgress?.({ stage: 'VALIDATING' })
        const review = reviewGeneratedResponse(response.text, currentRequest)
        if (review.issues.length) {
          logger.warn('AI generation requires correction', {
            model: request.model, elapsedMs: Date.now() - startedAt,
            acceptedCount: review.slots.filter(Boolean).length,
            correctionCount: review.slots.filter(item => item === null).length,
            issues: review.issues.slice(0, 20).map(({ path, code }) => ({ path, code })),
          })
          if (attempt > 0) throw new ValidationError(reviewError(review))
          previousReview = review
          currentRequest = { ...request, questionCount: review.slots.filter(item => item === null).length }
          continue
        }
        const replacements = review.slots.filter((item): item is GeneratedQuestion => item !== null)
        const questions = previousReview ? mergeCorrections(previousReview, replacements) : replacements
        const finalReview = reviewGeneratedResponse(JSON.stringify({ questions }), request)
        if (finalReview.issues.length) throw new ValidationError(reviewError(finalReview))
        logger.info('AI generation validated', { count: questions.length, attempts: attempt + 1, elapsedMs: Date.now() - startedAt })
        return questions
      } catch (error) {
        const reason = describeValidationError(error)
        if (attempt !== 0 || !reason) throw error
        validationReason = reason
        previousReview = undefined
        currentRequest = request
        logger.warn('AI generation requires correction', {
          model: request.model, elapsedMs: Date.now() - startedAt,
          errorType: error instanceof SyntaxError ? 'JSON' : 'REQUIREMENTS',
        })
      }
    }
    throw new ValidationError('AI chưa tạo được câu hỏi đúng yêu cầu sau khi thử lại.')
  } catch (error) {
    logger.error('Gemini generation request failed', {
      ...geminiErrorDiagnostics(error), model: request.model,
      elapsedMs: Date.now() - startedAt, requestedCount: request.questionCount,
    })
    throw toGeminiError(error, request.model)
  }
}
