import assert from 'node:assert/strict'
import { afterEach, it, mock } from 'node:test'
import { GoogleGenAI } from '@google/genai'
import * as gemini from '../../../lib/gemini'
import { logger } from '../../../lib/logger'
import { AppError } from '../../../errors/AppError'
import { generatedQuestionsSchema } from '../schemas/generated-question.schema'
import { generateWithGemini } from './gemini-question.service'

const request = {
  contents: [{ type: 'text' as const, text: 'PRIVATE_SOURCE_FOR_TEST' }], prompt: 'Generate questions',
  extraction: false, questionCount: 1, difficulty: 'HARD' as const,
  targetQuestionType: 'MULTIPLE_CHOICE' as const, model: 'gemini-3.1-flash-lite', timeoutMs: 10000,
}

const question = {
  title: 'Question for test', content: 'Question for test', explanation: 'Answer A is correct.',
  type: 'SINGLE_CHOICE', difficulty: 'HARD', difficultyReason: 'Requires analysis.', language: null,
  options: ['A', 'B', 'C', 'D'].map(content => ({ content, isCorrect: content === 'A' })),
  timeLimitMs: 2000, memoryLimitMb: 256, maxCodeSizeKb: 256, testCases: [],
}

function useLocalClient() {
  const client = new GoogleGenAI({ apiKey: 'PRIVATE_TEST_KEY' })
  mock.method(gemini, 'requireGemini', () => client)
}

afterEach(() => mock.restoreAll())

it('sends a compact schema through the real SDK while retaining backend array limits', async () => {
  useLocalClient()
  const fetchMock = mock.method(globalThis, 'fetch', async (_url: unknown, init: RequestInit) => {
    const body = JSON.parse(String(init.body))
    const questions = body.generationConfig.responseJsonSchema.properties.questions
    assert.deepEqual(questions.items.properties.difficulty.enum, ['HARD'])
    assert.equal(questions.minItems, 1)
    assert.equal(questions.maxItems, 1)
    assert.equal(questions.items.properties.options.maxItems, undefined)
    assert.equal(questions.items.properties.testCases, undefined)
    assert.equal(questions.items.properties.content, undefined)
    assert.ok(!questions.items.required.includes('content'))
    const { content: _content, language: _language, timeLimitMs: _time,
      memoryLimitMb: _memory, maxCodeSizeKb: _size, testCases: _tests, ...compactQuestion } = question
    return new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: JSON.stringify({ questions: [compactQuestion] }) }] }, finishReason: 'STOP' }],
    }), { status: 200, headers: { 'content-type': 'application/json' } })
  })
  const result = await generateWithGemini(request)
  assert.equal(result.length, 1)
  assert.equal(result[0].content, question.title)
  assert.deepEqual(result[0].testCases, [])
  assert.equal(fetchMock.mock.callCount(), 1)
  const tooManyOptions = { ...question, options: Array(21).fill(question.options[0]) }
  assert.equal(generatedQuestionsSchema.safeParse({ questions: [tooManyOptions] }).success, false)
})

it('reports an upstream invalid argument without retrying or leaking provider payloads', async () => {
  useLocalClient()
  const errorLog = mock.method(logger, 'error', () => {})
  const fetchMock = mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({
    error: { code: 400, status: 'INVALID_ARGUMENT', message: 'Request contains an invalid argument. PRIVATE_TEST_KEY PRIVATE_SOURCE_FOR_TEST' },
  }), { status: 400, headers: { 'content-type': 'application/json' } }))
  await assert.rejects(generateWithGemini(request), error => {
    assert.ok(error instanceof AppError)
    assert.match(error.message, /INVALID_ARGUMENT/)
    assert.ok(!error.message.includes('PRIVATE_'))
    return true
  })
  assert.equal(fetchMock.mock.callCount(), 1)
  const calls = errorLog.mock.calls
  assert.equal(calls.length, 1)
  assert.equal((calls[0].arguments[1] as { providerStatus: number }).providerStatus, 400)
  assert.ok(!JSON.stringify(calls.map(call => call.arguments)).includes('PRIVATE_'))
})
