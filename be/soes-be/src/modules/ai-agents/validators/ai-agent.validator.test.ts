import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createPracticeSchema, examDraftRequestSchema, runPracticeSampleBodySchema, runPracticeSampleParamsSchema, topicSuggestionRequestSchema } from './ai-agent.validator'

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

test('accepts one to twenty practice questions with a bounded instruction', () => {
  const materialId = 'e1a00e4f-580a-4899-a40e-eb5dfbb89712'
  assert.equal(createPracticeSchema.parse({ materialId, count: 1 }).count, 1)
  assert.equal(createPracticeSchema.parse({ materialId, count: 20, instruction: 'Ôn vòng lặp' }).count, 20)
  assert.equal(createPracticeSchema.safeParse({ materialId, count: 21 }).success, false)
  assert.equal(createPracticeSchema.safeParse({ materialId, count: 0 }).success, false)
  assert.equal(createPracticeSchema.safeParse({ materialId, instruction: 'x'.repeat(501) }).success, false)
  assert.equal(createPracticeSchema.parse({ materialId, kind: 'PROGRAMMING' }).kind, 'PROGRAMMING')
  assert.equal(createPracticeSchema.safeParse({ materialId, kind: 'MIXED' }).success, false)
})

test('running a sample requires a practice item and bounded source code', () => {
  const practiceSetId = 'e1a00e4f-580a-4899-a40e-eb5dfbb89712'
  const itemId = '32884078-c339-4be8-9a33-b3c808b12257'
  assert.equal(runPracticeSampleParamsSchema.parse({ practiceSetId, itemId }).itemId, itemId)
  assert.equal(runPracticeSampleParamsSchema.safeParse({ practiceSetId, itemId: 'bad' }).success, false)
  assert.equal(runPracticeSampleBodySchema.parse({ sourceCode: 'int main() {}' }).sourceCode, 'int main() {}')
  assert.equal(runPracticeSampleBodySchema.safeParse({ sourceCode: '' }).success, false)
  assert.equal(runPracticeSampleBodySchema.safeParse({ sourceCode: 'x'.repeat(20001) }).success, false)
})
