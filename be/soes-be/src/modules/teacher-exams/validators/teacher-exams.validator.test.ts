import assert from 'node:assert/strict'
import test from 'node:test'
import { examQuestionsSchema } from './teacher-exams.validator'

const topicId = '3196eaba-4536-4d2e-b688-05415aee7b74'
const inlineItem = {
  source: 'INLINE' as const,
  points: 1,
  question: {
    title: 'Câu hỏi mẫu', content: 'Câu hỏi mẫu', type: 'SINGLE_CHOICE' as const,
    difficulty: 'EASY' as const,
    options: [
      { content: 'Đúng', isCorrect: true },
      { content: 'Sai', isCorrect: false },
    ],
  },
}

test('inline exam questions preserve valid topic IDs and reject duplicates', () => {
  const parsed = examQuestionsSchema.parse({
    items: [{ ...inlineItem, question: { ...inlineItem.question, topicIds: [topicId] } }],
  })
  assert.equal(parsed.items[0].source, 'INLINE')
  if (parsed.items[0].source !== 'INLINE') return
  assert.deepEqual(parsed.items[0].question.topicIds, [topicId])

  assert.equal(examQuestionsSchema.safeParse({
    items: [{ ...inlineItem, question: { ...inlineItem.question, topicIds: [topicId, topicId] } }],
  }).success, false)
})
