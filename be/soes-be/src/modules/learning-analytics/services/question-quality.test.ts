import assert from 'node:assert/strict'
import { test } from 'node:test'
import { calculateQuestionQuality } from './question-quality'

test('requires enough responses before labeling a question easy or hard', () => {
  const outcomes = Array.from({ length: 19 }, () => ({
    questionId: 'q1', earnedPoints: 0, possiblePoints: 2,
  }))
  assert.equal(calculateQuestionQuality(outcomes)[0].signal, 'INSUFFICIENT_DATA')
  assert.equal(calculateQuestionQuality([...outcomes, outcomes[0]])[0].signal, 'VERY_HARD')
})

test('weights earned score by possible points', () => {
  const outcomes = [
    { questionId: 'q1', earnedPoints: 1, possiblePoints: 1 },
    { questionId: 'q1', earnedPoints: 0, possiblePoints: 9 },
  ]
  assert.equal(calculateQuestionQuality(outcomes)[0].averagePercentage, 10)
})
