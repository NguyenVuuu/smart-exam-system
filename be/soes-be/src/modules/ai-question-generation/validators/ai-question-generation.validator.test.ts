import assert from 'node:assert/strict'
import test from 'node:test'
import { saveGeneratedQuestionsSchema } from './ai-question-generation.validator'

const topicId = '3196eaba-4536-4d2e-b688-05415aee7b74'
const input = {
  questions: [{
    generationId: 'generation-1', subjectId: 'subject-1', topicIds: [topicId],
    question: {
      title: 'Câu hỏi mẫu', content: 'Câu hỏi mẫu', explanation: '',
      type: 'SINGLE_CHOICE', difficulty: 'EASY', difficultyReason: 'Kiến thức cơ bản',
      language: null, timeLimitMs: 2000, memoryLimitMb: 256, maxCodeSizeKb: 256,
      options: [{ content: 'Đúng', isCorrect: true }, { content: 'Sai', isCorrect: false }],
      testCases: [],
    },
  }],
}

test('approved AI questions require a topic', () => {
  assert.equal(saveGeneratedQuestionsSchema.safeParse(input).success, true)
  assert.equal(saveGeneratedQuestionsSchema.safeParse({
    questions: [{ ...input.questions[0], topicIds: [] }],
  }).success, false)
})
