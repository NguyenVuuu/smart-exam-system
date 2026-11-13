import { ForbiddenError, NotFoundError } from '../../../errors/AppError'
import type { AttemptResult } from '../../student-take-exam/types'

export function getReviewableQuestion(
  result: Pick<AttemptResult, 'available' | 'reviewAvailable' | 'reviewPolicy' | 'reviewItems'>,
  questionId: string,
) {
  if (!result.available || !result.reviewAvailable || result.reviewPolicy !== 'FULL_AFTER_RELEASE') {
    throw new ForbiddenError('Question explanation is not available for this exam')
  }
  const item = result.reviewItems.find((question) => question.questionId === questionId)
  if (!item) throw new NotFoundError('Review question not found')
  return item
}
