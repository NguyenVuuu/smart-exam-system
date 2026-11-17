import assert from 'node:assert/strict'
import { test } from 'node:test'
import { selectWeakPracticeTopic } from './practice-focus'

const weak = {
  topicId: 'join', subjectId: 'sql', subjectName: 'Cơ sở dữ liệu', code: 'JOIN', name: 'SQL JOIN',
  questionCount: 5, distinctQuestionCount: 3, respondentCount: 1,
  earnedPoints: 2, possiblePoints: 5, percentage: 40, sufficientData: true, needsPractice: true,
}

test('practice focus requires a supported weak topic in the material subject', () => {
  assert.equal(selectWeakPracticeTopic([weak], 'join', 'sql'), weak)
  assert.equal(selectWeakPracticeTopic([weak], 'join', 'cpp'), undefined)
  assert.equal(selectWeakPracticeTopic([{ ...weak, needsPractice: false }], 'join', 'sql'), undefined)
})
