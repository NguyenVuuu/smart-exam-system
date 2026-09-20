import assert from 'node:assert/strict'
import { afterEach, describe, it, mock } from 'node:test'
import type { GenerateContentParameters, GenerateContentResponse } from '@google/genai'
import * as gemini from '../../../lib/gemini'
import { generateWithGemini } from './gemini-question.service'
import { logger } from '../../../lib/logger'

const question = (index: number, difficulty = 'HARD') => ({
  title: `Câu hỏi kiểm tra ${index}`, content: `Câu hỏi kiểm tra ${index}`,
  type: 'SINGLE_CHOICE', difficulty, difficultyReason: 'Phân tích nhiều điều kiện.',
  explanation: 'Phương án A thỏa mãn các điều kiện.', language: null,
  options: ['A', 'B', 'C', 'D'].map(content => ({ content, isCorrect: content === 'A' })),
  timeLimitMs: 2000, memoryLimitMb: 256, maxCodeSizeKb: 256, testCases: [],
})

const request = {
  contents: [{ type: 'text' as const, text: 'Tài liệu kiểm thử' }], prompt: 'Sinh 3 câu khó',
  extraction: false, questionCount: 3, difficulty: 'HARD' as const,
  targetQuestionType: 'ALL' as const, model: 'gemini-3.1-flash-lite', timeoutMs: 120000,
}

const stubGemini = (responses: unknown[][], onResponse?: () => void) => {
  const calls: GenerateContentParameters[] = []
  mock.method(gemini, 'requireGemini', () => ({
    models: { generateContent: async (params: GenerateContentParameters) => {
      calls.push(params)
      onResponse?.()
      return { text: JSON.stringify({ questions: responses[Math.min(calls.length - 1, responses.length - 1)] }) } as GenerateContentResponse
    } },
  }) as ReturnType<typeof gemini.requireGemini>)
  return calls
}

afterEach(() => mock.restoreAll())

describe('Gemini generation requirements', () => {
  it('rejects the reported case: 1 HARD and 2 MEDIUM when 3 HARD were requested', async () => {
    const calls = stubGemini([
      [question(1), question(2, 'MEDIUM'), question(3, 'MEDIUM')],
      [question(2, 'MEDIUM'), question(3, 'MEDIUM')],
    ])
    await assert.rejects(generateWithGemini(request), /HARD/)
    assert.equal(calls.length, 2)
  })

  it('retries a mismatched difficulty without relabeling questions', async () => {
    const incorrect = [question(1), question(2, 'MEDIUM'), question(3, 'MEDIUM')]
    const corrected = [question(4), question(5)]
    const calls = stubGemini([incorrect, corrected])
    const questions = await generateWithGemini(request)
    assert.deepEqual(questions.map(q => q.title), [incorrect[0], ...corrected].map(q => q.title))
    assert.equal(calls.length, 2)
  })

  it('accepts AUTO difficulty in a single call', async () => {
    const calls = stubGemini([[question(1, 'EASY'), question(2, 'MEDIUM'), question(3)]])
    const questions = await generateWithGemini({ ...request, difficulty: 'AUTO' })
    assert.deepEqual(questions.map(q => q.difficulty), ['EASY', 'MEDIUM', 'HARD'])
    assert.equal(calls.length, 1)
  })

  it('constrains schema count, difficulty and type for each request without cross-request mutation', async () => {
    const calls = stubGemini([[question(1), question(2), question(3)]])
    await generateWithGemini({ ...request, targetQuestionType: 'MULTIPLE_CHOICE' })
    await generateWithGemini({ ...request, difficulty: 'AUTO' })
    const schemas = calls.map(call => call.config?.responseJsonSchema as {
      properties: { questions: { minItems: number; maxItems: number; items: {
        properties: { difficulty: { enum: string[] }; type: { enum: string[] } }
      } } }
    })
    const fixed = schemas[0].properties.questions
    assert.deepEqual([fixed.minItems, fixed.maxItems], [3, 3])
    assert.deepEqual(fixed.items.properties.difficulty.enum, ['HARD'])
    assert.ok(!fixed.items.properties.type.enum.includes('PROGRAMMING'))
    assert.deepEqual(schemas[1].properties.questions.items.properties.difficulty.enum, ['EASY', 'MEDIUM', 'HARD'])
  })

  it('rejects incorrect question count and duplicates', async () => {
    stubGemini([[question(1), question(1), question(2)], [question(1)]])
    await assert.rejects(generateWithGemini(request), /trùng/)
  })

  it('rejects objective questions when programming was requested', async () => {
    stubGemini([[question(1), question(2), question(3)]])
    await assert.rejects(generateWithGemini({ ...request, targetQuestionType: 'PROGRAMMING' }), /PROGRAMMING/)
  })

  it('preserves actual difficulty and variable count when extracting', async () => {
    stubGemini([[question(1, 'MEDIUM')]])
    const questions = await generateWithGemini({ ...request, extraction: true })
    assert.equal(questions.length, 1)
    assert.equal(questions[0].difficulty, 'MEDIUM')
  })

  it('rejects extracted results above the configured maximum', async () => {
    stubGemini([[question(1), question(2), question(3), question(4)]])
    await assert.rejects(generateWithGemini({ ...request, extraction: true }), /tối đa 3 câu/)
  })

  it('reuses one abort signal and only the remaining time for corrections', async () => {
    let now = 1000
    mock.method(Date, 'now', () => now)
    const calls = stubGemini([
      [question(1, 'MEDIUM')], [question(1), question(2), question(3)],
    ], () => { now += 250 })
    await generateWithGemini({ ...request, timeoutMs: 1000 })
    assert.equal(calls[0].config?.abortSignal, calls[1].config?.abortSignal)
    assert.equal(calls[0].config?.httpOptions?.timeout, 1000)
    assert.equal(calls[1].config?.httpOptions?.timeout, 750)
    assert.deepEqual(calls[0].config?.httpOptions?.retryOptions, { attempts: 1 })
  })

  it('does not retry or accept responses once the shared deadline is exceeded', async () => {
    let now = 0
    mock.method(Date, 'now', () => now)
    const calls = stubGemini([[question(1), question(2), question(3)]], () => { now = 1001 })
    await assert.rejects(generateWithGemini({ ...request, timeoutMs: 1000 }), /quá thời gian/)
    assert.equal(calls.length, 1)
  })

  it('does not consume another generation on quota errors', async () => {
    const calls = stubGemini([], () => { throw new Error('429 RESOURCE_EXHAUSTED') })
    await assert.rejects(generateWithGemini(request), /hạn mức/)
    assert.equal(calls.length, 1)
  })

  it('keeps code operators when comparing questions for duplicates', async () => {
    const questions = ['x + y', 'x - y', 'x * y'].map(expression => ({
      ...question(1), title: `Kết quả ${expression}?`, content: `Kết quả ${expression}?`,
    }))
    stubGemini([questions])
    assert.equal((await generateWithGemini(request)).length, 3)
  })

  it('repairs only a malformed field, preserves accepted positions and logs no private content', async () => {
    const warn = mock.method(logger, 'warn', () => {})
    const invalid = { ...question(2), explanation: '', difficultyReason: 'x'.repeat(1001) }
    const calls = stubGemini([[question(1), invalid, question(3)], [question(4)]])
    const progress = mock.fn()
    const result = await generateWithGemini({ ...request, onProgress: progress })
    assert.deepEqual(result.map(item => item.title), [question(1), question(4), question(3)].map(item => item.title))
    const schema = calls[1].config?.responseJsonSchema as { properties: { questions: { maxItems: number } } }
    assert.equal(schema.properties.questions.maxItems, 1)
    const logs = JSON.stringify(warn.mock.calls.map(call => call.arguments))
    assert.match(logs, /questions.1.difficultyReason/)
    assert.match(logs, /too_big/)
    assert.ok(!logs.includes(invalid.difficultyReason))
    assert.ok(!logs.includes(question(1).title))
    assert.ok(progress.mock.calls.some(call => call.arguments[0].stage === 'CORRECTING' && call.arguments[0].completedCount === 2))
  })

  it('requests only missing questions without discarding accepted questions', async () => {
    stubGemini([[question(1)], [question(2), question(3)]])
    assert.deepEqual((await generateWithGemini(request)).map(q => q.title), [1, 2, 3].map(i => question(i).title))
  })

  it('rejects an incomplete repair rather than returning a partial success', async () => {
    stubGemini([[question(1), question(2, 'MEDIUM'), question(3, 'MEDIUM')], [question(4)]])
    await assert.rejects(generateWithGemini(request))
  })
})

describe('Gemini response failures', () => {
  it('does not repeat a truncated generation with the same output limit', async () => {
    const generateContent = mock.fn(async () => ({ text: '{', candidates: [{ finishReason: 'MAX_TOKENS' }] }))
    mock.method(gemini, 'requireGemini', () => ({ models: { generateContent } }) as unknown as ReturnType<typeof gemini.requireGemini>)
    await assert.rejects(generateWithGemini(request), /giới hạn đầu ra/)
    assert.equal(generateContent.mock.callCount(), 1)
  })
})
