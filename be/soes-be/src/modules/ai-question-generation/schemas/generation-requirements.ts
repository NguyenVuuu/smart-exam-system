import { generatedQuestionsJsonSchema, type GeneratedQuestion } from './generated-question.schema'
import type { GenerateQuestionsBody } from '../validators/ai-question-generation.validator'

export interface GenerationRequirements {
  extraction: boolean
  questionCount: number
  difficulty: GenerateQuestionsBody['difficulty']
  targetQuestionType: GenerateQuestionsBody['targetQuestionType']
}

const questionSchema = generatedQuestionsJsonSchema.properties.questions.items

const allowedTypes = (target: GenerationRequirements['targetQuestionType']) => {
  if (target === 'PROGRAMMING') return ['PROGRAMMING']
  if (target === 'MULTIPLE_CHOICE') return ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE']
  return [...questionSchema.properties.type.enum]
}

export function buildGenerationResponseSchema(requirements: GenerationRequirements) {
  const { extraction, questionCount, difficulty, targetQuestionType } = requirements
  const objectiveOnly = targetQuestionType === 'MULTIPLE_CHOICE'
  const omitted = new Set(objectiveOnly
    ? ['content', 'language', 'timeLimitMs', 'memoryLimitMb', 'maxCodeSizeKb', 'testCases'] : [])
  return {
    ...generatedQuestionsJsonSchema,
    properties: {
      questions: {
        type: 'array', minItems: extraction ? 1 : questionCount, maxItems: questionCount,
        items: {
          ...questionSchema,
          required: questionSchema.required.filter(field => !omitted.has(field)),
          properties: {
            ...Object.fromEntries(Object.entries(questionSchema.properties).filter(([field]) => !omitted.has(field))),
            title: { type: 'string', description: objectiveOnly
              ? 'Câu hỏi hoặc mệnh đề đầy đủ, ưu tiên 120-170 ký tự, bắt buộc không quá 200 ký tự; không trả content.'
              : 'Tiêu đề từ 3 đến 200 ký tự.' },
            type: { type: 'string', enum: allowedTypes(targetQuestionType) },
            difficulty: {
              type: 'string',
              enum: extraction || difficulty === 'AUTO' ? ['EASY', 'MEDIUM', 'HARD'] : [difficulty],
            },
          },
        },
      },
    },
  }
}

export function validateGenerationRequirements(questions: GeneratedQuestion[], requirements: GenerationRequirements) {
  const errors: string[] = []
  const { extraction, questionCount, difficulty, targetQuestionType } = requirements
  if (!extraction && questions.length !== questionCount) {
    errors.push(`Phải trả đúng ${questionCount} câu không trùng nhau, hiện nhận được ${questions.length} câu`)
  }
  if (extraction && questions.length > questionCount) {
    errors.push(`Chỉ được bóc tách tối đa ${questionCount} câu trong một lần`)
  }
  const types = allowedTypes(targetQuestionType)
  questions.forEach((question, index) => {
    if (!extraction && difficulty !== 'AUTO' && question.difficulty !== difficulty) {
      errors.push(`questions.${index}.difficulty phải là ${difficulty}; hãy viết lại nội dung đạt mức này, không chỉ đổi nhãn`)
    }
    if (!types.includes(question.type)) {
      errors.push(`questions.${index}.type phải thuộc ${types.join(', ')}`)
    }
    if (!extraction && !question.explanation.trim()) {
      errors.push(`questions.${index}.explanation phải giải thích đáp án hoặc thuật toán`)
    }
  })
  return errors
}
