import assert from 'node:assert/strict'
import test from 'node:test'
import { anchorKey, computeStoredExamHash, hashVersion } from './exam-blockchain.service'

const exam = {
  id: 'exam-1', title: 'Final', description: 'Description', type: 'FINAL', format: 'OBJECTIVE',
  subjectId: 'subject-1', semesterId: 'semester-1', defaultDurationMinutes: 60, totalPoints: 10,
  sections: [{ id: 'section-1', orderIndex: 1, title: 'Section', description: null, type: 'OBJECTIVE', targetPoints: 10 }],
  examQuestions: [{
    id: 'q-1', orderIndex: 1, title: 'Question', content: 'Content', explanation: 'Why A',
    sectionId: 'section-1', type: 'SINGLE_CHOICE', difficulty: 'EASY', language: null, points: 10,
    options: [{ id: 'option-1', orderIndex: 1, content: 'Answer A', isCorrect: true }],
    programmingConfig: null,
    programmingTests: [{ id: 'test-1', input: '1', expectedOutput: '2', isHidden: true, isSample: false }],
  }],
} as unknown as Parameters<typeof computeStoredExamHash>[0]

test('v2 covers answer explanations, sections, and programming test attributes', () => {
  const original = computeStoredExamHash(exam, 2)
  assert.match(original, /^v2:[a-f0-9]{64}$/)
  const withChangedExplanation = structuredClone(exam)
  withChangedExplanation.examQuestions[0].explanation = 'Why B'
  assert.notEqual(computeStoredExamHash(withChangedExplanation, 2), original)
  const withChangedSection = structuredClone(exam)
  withChangedSection.sections[0].title = 'Changed section'
  assert.notEqual(computeStoredExamHash(withChangedSection, 2), original)
  const withChangedTest = structuredClone(exam)
  withChangedTest.examQuestions[0].programmingTests[0].isSample = true
  assert.notEqual(computeStoredExamHash(withChangedTest, 2), original)
})

test('legacy hashes and chain keys remain distinct from v2', () => {
  const legacyHash = computeStoredExamHash(exam, 1)
  assert.equal(hashVersion(legacyHash), 1)
  assert.equal(hashVersion(computeStoredExamHash(exam, 2)), 2)
  assert.equal(anchorKey('exam-1', 1), 'exam-1')
  assert.equal(anchorKey('exam-1', 2), 'exam-1:v2')
})
