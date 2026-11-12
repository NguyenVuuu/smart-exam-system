import assert from 'node:assert/strict'
import { test } from 'node:test'
import { calculateTopicMastery } from './topic-mastery'

const join = { id: 'join', code: 'JOIN', name: 'SQL joins' }

test('uses question points as denominator and preserves partial credit', () => {
  const result = calculateTopicMastery([
    { questionId: 'q1', earnedPoints: 2, possiblePoints: 4, topics: [join] },
    { questionId: 'q2', earnedPoints: 0, possiblePoints: 6, topics: [join] },
  ])
  assert.deepEqual(result, [{
    topicId: 'join', code: 'JOIN', name: 'SQL joins', questionCount: 2,
    earnedPoints: 2, possiblePoints: 10, percentage: 20, sufficientData: false,
  }])
})

test('does not claim sufficient evidence from four questions', () => {
  const observations = Array.from({ length: 5 }, (_, index) => ({
    questionId: `q${index}`, earnedPoints: 1, possiblePoints: 1, topics: [join],
  }))
  assert.equal(calculateTopicMastery(observations.slice(0, 4))[0].sufficientData, false)
  assert.equal(calculateTopicMastery(observations)[0].sufficientData, true)
})

test('ignores untagged and invalid observations', () => {
  assert.deepEqual(calculateTopicMastery([
    { questionId: 'q1', earnedPoints: 1, possiblePoints: 1, topics: [] },
    { questionId: 'q2', earnedPoints: 1, possiblePoints: 0, topics: [join] },
  ]), [])
})
