import assert from 'node:assert/strict'
import { test } from 'node:test'
import { candidateRequiresReview, validateExamDraftSelection } from './exam-draft.service'

type Candidate = Parameters<typeof validateExamDraftSelection>[1][number]
const topicId = '155087df-c2bb-401e-a409-5920b5f6ea01'
const pool = [
  { id: '1', type: 'SINGLE_CHOICE', topics: [{ topicId }] },
  { id: '2', type: 'PROGRAMMING', topics: [{ topicId }] },
  { id: '3', type: 'SINGLE_CHOICE', topics: [] },
] as unknown as Candidate[]

test('rejects duplicate, unknown and short AI exam selections', () => {
  const request = { desiredCount: 2, format: 'MIXED' as const, topicTargets: [] }
  assert.throws(() => validateExamDraftSelection(['1', '1'], pool, request))
  assert.throws(() => validateExamDraftSelection(['1', 'x'], pool, request))
  assert.throws(() => validateExamDraftSelection(['1'], pool, request))
})

test('checks mixed format and topic targets against actual questions', () => {
  const request = { desiredCount: 2, format: 'MIXED' as const, topicTargets: [{ topicId, count: 2 }] }
  assert.throws(() => validateExamDraftSelection(['1', '3'], pool, request))
  assert.throws(() => validateExamDraftSelection(['2', '3'], pool, request))
  assert.equal(validateExamDraftSelection(['1', '2'], pool, request).length, 2)
})

test('excludes questions with a required audit finding from AI selection', () => {
  const question = {
    id: 'valid', title: 'Valid title', content: 'A meaningful question', explanation: 'Explanation',
    type: 'SINGLE_CHOICE', language: null,
    options: [
      { content: 'Answer A', isCorrect: true }, { content: 'Answer B', isCorrect: false },
    ],
    programmingConfig: null, programmingTests: [],
  } as unknown as Candidate
  assert.equal(candidateRequiresReview(question), false)
  assert.equal(candidateRequiresReview({ ...question, options: [] }), true)
})
