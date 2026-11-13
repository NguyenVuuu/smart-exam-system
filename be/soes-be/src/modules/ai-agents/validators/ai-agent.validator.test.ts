import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createPracticeSchema, examDraftRequestSchema, topicSuggestionRequestSchema } from './ai-agent.validator'

const request = {
  subjectId: 'subj-java',
  format: 'OBJECTIVE',
  desiredCount: 10,
  message: 'Ưu tiên câu trung bình',
}

test('accepts a seeded subject ID for an AI exam draft', () => {
  assert.equal(examDraftRequestSchema.parse(request).subjectId, request.subjectId)
})

test('accepts a seeded subject ID for topic suggestions', () => {
  const result = topicSuggestionRequestSchema.parse({
    subjectId: 'subj-java', title: 'Java', content: 'Nội dung về lập trình Java',
  })
  assert.equal(result.subjectId, 'subj-java')
})

test('rejects missing or invalid subject IDs', () => {
  assert.equal(examDraftRequestSchema.safeParse({ ...request, subjectId: '' }).success, false)
  assert.equal(examDraftRequestSchema.safeParse({ ...request, subjectId: 'x'.repeat(101) }).success, false)
})

test('accepts one to ten practice questions with a bounded instruction', () => {
  const materialId = 'e1a00e4f-580a-4899-a40e-eb5dfbb89712'
  assert.equal(createPracticeSchema.parse({ materialId, count: 1 }).count, 1)
  assert.equal(createPracticeSchema.parse({ materialId, count: 10, instruction: 'Ôn vòng lặp' }).count, 10)
  assert.equal(createPracticeSchema.safeParse({ materialId, count: 11 }).success, false)
  assert.equal(createPracticeSchema.safeParse({ materialId, count: 0 }).success, false)
  assert.equal(createPracticeSchema.safeParse({ materialId, instruction: 'x'.repeat(501) }).success, false)
})
