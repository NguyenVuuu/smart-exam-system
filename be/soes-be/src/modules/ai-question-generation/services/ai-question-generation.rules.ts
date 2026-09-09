import { ValidationError } from '../../../errors/AppError'

export function assertQuestionCountWithinLimit(questionCount: number, maximumQuestionCount: number): void {
  if (questionCount > maximumQuestionCount) {
    throw new ValidationError(`Mỗi lần chỉ được sinh tối đa ${maximumQuestionCount} câu hỏi`)
  }
}
