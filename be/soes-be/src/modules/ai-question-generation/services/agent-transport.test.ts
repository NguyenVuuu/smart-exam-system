import assert from 'node:assert/strict'
import { afterEach, test, mock } from 'node:test'
import { AppError } from '../../../errors/AppError'
import { buildGenerationResponseSchema } from '../schemas/generation-requirements'
import { generateWithQuestionAgent } from './gemini-question.service'

const request = {
  contents: [{ type: 'text' as const, text: 'PRIVATE_SOURCE_FOR_TEST' }],
  prompt: 'Generate questions', extraction: false, questionCount: 1,
  difficulty: 'HARD' as const, targetQuestionType: 'MULTIPLE_CHOICE' as const,
  model: 'gemini-3.5-flash-lite', timeoutMs: 10000,
}

const question = {
  title: 'Question for test', content: 'Question for test', explanation: 'Answer A is correct.',
  type: 'SINGLE_CHOICE', difficulty: 'HARD', difficultyReason: 'Requires analysis.', language: null,
  options: ['A', 'B', 'C', 'D'].map(content => ({ content, isCorrect: content === 'A' })),
  timeLimitMs: 2000, memoryLimitMb: 256, maxCodeSizeKb: 256, testCases: [],
}

const previousEnabled = process.env.AI_AGENT_ENABLED
const previousSecret = process.env.AI_AGENT_SHARED_SECRET

afterEach(() => {
  mock.restoreAll()
  if (previousEnabled === undefined) delete process.env.AI_AGENT_ENABLED
  else process.env.AI_AGENT_ENABLED = previousEnabled
  if (previousSecret === undefined) delete process.env.AI_AGENT_SHARED_SECRET
  else process.env.AI_AGENT_SHARED_SECRET = previousSecret
})

test('agent draft is reviewed and corrected before it reaches the teacher', async () => {
  process.env.AI_AGENT_ENABLED = 'true'
  process.env.AI_AGENT_SHARED_SECRET = 'test-secret'
  const payloads: Array<{
    model: string
    contents: typeof request.contents
    responseSchema: ReturnType<typeof buildGenerationResponseSchema>
    prompt: string
  }> = []
  mock.method(globalThis, 'fetch', async (_url: unknown, init: RequestInit) => {
    payloads.push(JSON.parse(String(init.body)))
    const draft = payloads.length === 1 ? { ...question, difficulty: 'EASY' } : question
    return new Response(JSON.stringify({ questions: [draft] }), { status: 200 })
  })

  const result = await generateWithQuestionAgent(request)
  assert.equal(result[0].difficulty, 'HARD')
  assert.equal(payloads.length, 2)
  assert.equal(payloads[0].model, request.model)
  assert.equal(payloads[0].contents[0].text, request.contents[0].text)
  assert.deepEqual(payloads[0].responseSchema.properties.questions.items.properties.difficulty.enum, ['HARD'])
  assert.match(payloads[1].prompt, /HIỆU CHỈNH/)
})

test('agent failure is returned without silently calling direct Gemini', async () => {
  process.env.AI_AGENT_ENABLED = 'true'
  process.env.AI_AGENT_SHARED_SECRET = 'test-secret'
  const fetchMock = mock.method(globalThis, 'fetch', async () => new Response('unavailable', { status: 503 }))
  await assert.rejects(generateWithQuestionAgent(request), error =>
    error instanceof AppError && error.statusCode === 503)
  assert.equal(fetchMock.mock.callCount(), 1)
})

test('malformed agent draft gets one correction attempt', async () => {
  process.env.AI_AGENT_ENABLED = 'true'
  process.env.AI_AGENT_SHARED_SECRET = 'test-secret'
  const fetchMock = mock.method(globalThis, 'fetch', async () =>
    new Response(JSON.stringify({ unexpected: true }), { status: 200 }))
  await assert.rejects(generateWithQuestionAgent(request), error =>
    error instanceof AppError && error.statusCode === 422)
  assert.equal(fetchMock.mock.callCount(), 2)
})
