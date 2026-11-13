import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { AttemptResult } from '../../student-take-exam/types'
import { getReviewableQuestion } from './review-question.policy'

const item = {
  questionId: 'question-1', orderIndex: 1, type: 'SINGLE_CHOICE',
  content: '2 + 2 = ?', points: 1, score: 0, isCorrect: false,
  selectedOptionIds: ['a'], correctOptionIds: ['b'],
  options: [{ id: 'a', content: '3' }, { id: 'b', content: '4' }],
} as const

test('question explanation requires released full review and the owned question', () => {
  const result = {
    available: true, reviewAvailable: true, reviewPolicy: 'FULL_AFTER_RELEASE',
    reviewItems: [item],
  } as unknown as AttemptResult
  assert.equal(getReviewableQuestion(result, 'question-1').content, item.content)
  assert.throws(() => getReviewableQuestion({ ...result, available: false }, 'question-1'))
  assert.throws(() => getReviewableQuestion({ ...result, reviewAvailable: false }, 'question-1'))
  assert.throws(() => getReviewableQuestion({ ...result, reviewPolicy: 'ANSWERS_NO_KEY' }, 'question-1'))
  assert.throws(() => getReviewableQuestion(result, 'question-2'))
})
