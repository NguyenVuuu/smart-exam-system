import { ValidationError } from '../../../errors/AppError'
import { generatedQuestionSchema, type GeneratedQuestion } from '../schemas/generated-question.schema'
import { validateGenerationRequirements, type GenerationRequirements } from '../schemas/generation-requirements'
import { normalizeObjectiveFields, deduplicateQuestions } from './generated-question.normalizer'
import { validateGeneratedQuestions } from './generated-question.validation'

interface QuestionIssue { index: number; path: string; code: string; message: string }
export interface GenerationReview {
  slots: Array<GeneratedQuestion | null>
  issues: QuestionIssue[]
  rejected: unknown[]
}

export function reviewGeneratedResponse(text: string | undefined, request: GenerationRequirements): GenerationReview {
  if (!text) throw new ValidationError('Gemini trả về nội dung rỗng.')
  const payload: unknown = normalizeObjectiveFields(JSON.parse(text))
  if (!payload || typeof payload !== 'object' || !('questions' in payload) || !Array.isArray(payload.questions)) {
    throw new ValidationError('JSON phải có danh sách questions.')
  }
  const raw = payload.questions as unknown[]
  if (raw.length > request.questionCount) throw new ValidationError(`Chỉ được trả tối đa ${request.questionCount} câu.`)
  if (request.extraction && !raw.length) throw new ValidationError('Không tìm thấy câu hỏi trong tài liệu.')
  const result: GenerationReview = { slots: [], issues: [], rejected: [] }
  const count = request.extraction ? raw.length : request.questionCount
  for (let index = 0; index < count; index += 1) {
    const parsed = generatedQuestionSchema.safeParse(raw[index])
    const issues: QuestionIssue[] = []
    if (!parsed.success) {
      issues.push(...parsed.error.issues.map(issue => ({
        index, path: `questions.${index}.${issue.path.join('.')}`, code: issue.code, message: issue.message,
      })))
    } else {
      const question = parsed.data
      const errors = [
        ...validateGenerationRequirements([question], { ...request, questionCount: 1 }),
        ...validateGeneratedQuestions([question], request.extraction),
      ]
      const accepted = result.slots.filter((item): item is GeneratedQuestion => item !== null)
      if (deduplicateQuestions([...accepted, question]).length !== accepted.length + 1) errors.push('Câu hỏi bị trùng nội dung.')
      issues.push(...errors.map(message => ({ index, path: `questions.${index}`, code: 'custom', message })))
    }
    result.slots.push(parsed.success && !issues.length ? parsed.data : null)
    result.issues.push(...issues)
    if (issues.length) result.rejected.push(raw[index] ?? null)
  }
  return result
}

export function mergeCorrections(review: GenerationReview, replacements: GeneratedQuestion[]) {
  if (replacements.length !== review.slots.filter(item => item === null).length) {
    throw new ValidationError('AI chưa trả đúng số câu cần hiệu chỉnh.')
  }
  let replacementIndex = 0
  return review.slots.map(item => item ?? replacements[replacementIndex++])
}

export function reviewError(review: GenerationReview) {
  return review.issues.slice(0, 8).map(issue => `${issue.path}: ${issue.message}`).join('; ')
}
