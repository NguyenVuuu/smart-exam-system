import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { ValidationError } from '../../../errors/AppError'
import { assertQuestionCountWithinLimit } from './ai-question-generation.rules'

describe('assertQuestionCountWithinLimit', () => {
  it('accepts a question count equal to the configured limit', () => {
    assert.doesNotThrow(() => assertQuestionCountWithinLimit(20, 20))
  })

  it('rejects a question count above the configured limit', () => {
    assert.throws(
      () => assertQuestionCountWithinLimit(21, 20),
      (error) => error instanceof ValidationError
        && error.message === 'Mỗi lần chỉ được sinh tối đa 20 câu hỏi',
    )
  })
})
