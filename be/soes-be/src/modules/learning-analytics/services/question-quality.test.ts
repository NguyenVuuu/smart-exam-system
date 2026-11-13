import assert from 'node:assert/strict'
import { test } from 'node:test'
import { calculateQuestionQuality } from './question-quality'

test('requires enough responses before labeling a question easy or hard', () => {
  const outcomes = Array.from({ length: 19 }, (_, index) => ({
    questionId: 'q1', studentId: `student-${index}`, title: 'Question 1', earnedPoints: 0, possiblePoints: 2,
  }))
  assert.equal(calculateQuestionQuality(outcomes)[0].signal, 'INSUFFICIENT_DATA')
  assert.equal(calculateQuestionQuality([...outcomes, { ...outcomes[0], studentId: 'student-19' }])[0].signal, 'VERY_HARD')
})

test('repeated attempts by one student cannot establish question quality', () => {
  const outcomes = Array.from({ length: 20 }, () => ({
    questionId: 'q1', studentId: 'student-1', title: 'Question 1', earnedPoints: 0, possiblePoints: 1,
  }))
  const [quality] = calculateQuestionQuality(outcomes)
  assert.equal(quality.exposureCount, 20)
  assert.equal(quality.respondentCount, 1)
  assert.equal(quality.signal, 'INSUFFICIENT_DATA')
})

test('weights earned score by possible points', () => {
  const outcomes = [
    { questionId: 'q1', studentId: 'student-1', title: 'Question 1', earnedPoints: 1, possiblePoints: 1 },
    { questionId: 'q1', studentId: 'student-2', title: 'Question 1', earnedPoints: 0, possiblePoints: 9 },
  ]
  assert.equal(calculateQuestionQuality(outcomes)[0].averagePercentage, 10)
})
