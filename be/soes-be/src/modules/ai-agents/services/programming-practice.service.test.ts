import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ValidationError } from '../../../errors/AppError'
import { judge0Service } from '../../../lib/judge0'
import { collectVerifiedProgrammingQuestions, gradeProgrammingPractice, gradeProgrammingPracticeSet, verifyProgrammingDraft } from './programming-practice.service'

type Candidate = Awaited<ReturnType<Parameters<typeof collectVerifiedProgrammingQuestions>[1]>>[number]

test('grading fills free worker slots across questions without waiting for a slow earlier question', { timeout: 5000 }, async context => {
  let releaseSlow!: () => void
  let notifyLast!: () => void
  const slow = new Promise<void>(resolve => { releaseSlow = resolve })
  const lastStarted = new Promise<void>(resolve => { notifyLast = resolve })
  let active = 0
  let maximum = 0
  let calls = 0
  context.mock.method(judge0Service, 'submitAndPoll', async (submission: { source_code: string; stdin: string }) => {
    calls++
    maximum = Math.max(maximum, ++active)
    if (submission.source_code === 'q4') notifyLast()
    if (submission.source_code === 'q0' && submission.stdin === '1') await slow
    else await new Promise(resolve => setImmediate(resolve))
    active--
    return { stdout: submission.source_code === 'q3' ? '0' : '1', stderr: null, compile_output: null, message: null,
      status: { id: 3, description: 'Accepted' }, time: '0.01', memory: 1024 }
  })
  const pending = gradeProgrammingPracticeSet(Array.from({ length: 5 }, (_, index) => ({
    sourceCode: `q${index}`, question: candidate(`Question ${index}`),
  })))
  try {
    await lastStarted
    assert.equal(maximum, 6)
  } finally { releaseSlow() }
  const results = await pending
  assert.equal(calls, 10)
  assert.equal(active, 0)
  assert.deepEqual(results.map(result => result.score), [1, 1, 1, 0, 1])
  assert(results.every(result => result.totalTestCases === 2))
})

function candidate(stem: string): Candidate {
  return {
    stem, language: 'JAVA', starterCode: 'class Main { public static void main(String[] args) {} }',
    referenceSolution: 'class Main { public static void main(String[] args) { System.out.print(1); } }',
    testCases: [{ input: '1', expectedOutput: '1' }, { input: '2', expectedOutput: '1' }],
    explanation: 'Chương trình đọc dữ liệu đầu vào, xử lý yêu cầu và in kết quả ra đầu ra chuẩn.',
    supportQuote: 'Vòng lặp dùng để xử lý các phần tử của mảng.',
  }
}

test('keeps Judge-approved programming questions and generates only missing replacements', async () => {
  const firstInvalid = candidate('Bài đầu tiên không vượt qua Judge')
  const firstValid = candidate('Bài thứ hai vượt qua Judge')
  const replacement = candidate('Bài thay thế vượt qua Judge')
  const requestedCounts: number[] = []
  const exclusions: string[][] = []

  const result = await collectVerifiedProgrammingQuestions(2, async (missing, excludedStems) => {
    requestedCounts.push(missing)
    exclusions.push(excludedStems)
    return requestedCounts.length === 1 ? [firstInvalid, firstValid] : [replacement]
  }, async (questions) => questions.filter((question) => question !== firstInvalid))

  assert.deepEqual(result, [firstValid, replacement])
  assert.deepEqual(requestedCounts, [2, 1])
  assert.deepEqual(exclusions, [[], [firstInvalid.stem, firstValid.stem]])
})

test('stops after three incomplete generations', async () => {
  let calls = 0
  await assert.rejects(collectVerifiedProgrammingQuestions(1, async () => {
    calls += 1
    return [candidate(`Bài không hợp lệ lần ${calls}`)]
  }, async () => []), (error) => {
    assert.ok(error instanceof ValidationError)
    assert.match(error.message, /chưa tạo đủ bài lập trình/)
    return true
  })
  assert.equal(calls, 3)
})

test('draft checks only the first case of each reference solution and rejects a failed first case', async (context) => {
  const valid = candidate('Bài hợp lệ qua toàn bộ test case')
  const invalid = candidate('Bài có expected output không khớp')
  let submission = 0
  context.mock.method(judge0Service, 'submitAndPoll', async () => {
    submission += 1
    const accepted = submission === 1
    return {
      stdout: accepted ? '1' : '0', stderr: null, compile_output: null, message: null,
      status: { id: accepted ? 3 : 4, description: accepted ? 'Accepted' : 'Wrong Answer' },
      time: '0.01', memory: 1024,
    }
  })

  assert.deepEqual(await verifyProgrammingDraft([valid, invalid], 'JAVA'), [valid])
  assert.equal(submission, 2)
})

test('Judge unavailability does not accept a structurally valid question', async context => {
  context.mock.method(judge0Service, 'submitAndPoll', async () => { throw new Error('Unavailable') })
  await assert.rejects(verifyProgrammingDraft([candidate('Unavailable Judge')], 'JAVA'),
    (error: unknown) => error instanceof Error && 'statusCode' in error && error.statusCode === 503)
  await assert.rejects(gradeProgrammingPractice('class Main {}', candidate('Unavailable Judge')),
    (error: unknown) => error instanceof Error && 'statusCode' in error && error.statusCode === 503)
})

test('draft accepts a passing first case without running the remaining cases', async context => {
  const inputs: string[] = []
  context.mock.method(judge0Service, 'submitAndPoll', async (submission: { stdin?: string }) => {
    inputs.push(submission.stdin ?? '')
    return {
      stdout: submission.stdin === '1' ? '1' : '0', stderr: null, compile_output: null, message: null,
      status: { id: 3, description: 'Accepted' }, time: '0.01', memory: 1024,
    }
  })
  const question = candidate('First case only draft policy')
  assert.deepEqual(await verifyProgrammingDraft([question], 'JAVA'), [question])
  assert.deepEqual(inputs, ['1'])
})

test('student grading still runs every case and fails when a later case is incorrect', async context => {
  const inputs: string[] = []
  context.mock.method(judge0Service, 'submitAndPoll', async (submission: { stdin?: string }) => {
    inputs.push(submission.stdin ?? '')
    return { stdout: submission.stdin === '1' ? '1' : '0', stderr: null, compile_output: null, message: null,
      status: { id: 3, description: 'Accepted' }, time: '0.01', memory: 1024 }
  })
  assert.deepEqual(await gradeProgrammingPractice('class Main {}', candidate('Full student grading unchanged')),
    { score: 0, passedTestCases: 1, totalTestCases: 2 })
  assert.deepEqual(inputs, ['1', '2'])
})

test('draft reference checks are bounded to five simultaneous jobs and preserve question order', async context => {
  let active = 0
  let maximum = 0
  let calls = 0
  context.mock.method(judge0Service, 'submitAndPoll', async () => {
    calls++
    active++
    maximum = Math.max(maximum, active)
    await new Promise(resolve => setImmediate(resolve))
    active--
    return { stdout: '1', stderr: null, compile_output: null, message: null,
      status: { id: 3, description: 'Accepted' }, time: '0.01', memory: 1024 }
  })
  const questions = Array.from({ length: 20 }, (_, index) => candidate(`Bounded first-case check ${index}`))
  assert.deepEqual(await verifyProgrammingDraft(questions, 'JAVA'), questions)
  assert.equal(calls, 20)
  assert.equal(maximum, 5)
})

test('identical reference verification is coalesced but changed tests are checked again', async context => {
  let calls = 0
  context.mock.method(judge0Service, 'submitAndPoll', async () => {
    calls++
    return { stdout: '1', stderr: null, compile_output: null, message: null,
      status: { id: 3, description: 'Accepted' }, time: '0.01', memory: 1024 }
  })
  const question = candidate('Cache exact verified reference')
  const results = await Promise.all(Array.from({ length: 10 }, () => verifyProgrammingDraft([question], 'JAVA')))
  assert(results.every(result => result.length === 1))
  assert.equal(calls, 1)
  await verifyProgrammingDraft([question], 'JAVA')
  assert.equal(calls, 1)
  const changed = { ...question, testCases: [{ input: '1', expectedOutput: '9' }, question.testCases[1]] }
  assert.deepEqual(await verifyProgrammingDraft([changed], 'JAVA'), [])
  assert.equal(calls, 2)
  assert.deepEqual(await verifyProgrammingDraft([changed], 'JAVA'), [])
  assert.equal(calls, 3)
})

test('skips Judge for unmodified starter code and short-circuits on compile error', async context => {
  let calls = 0
  context.mock.method(judge0Service, 'submitAndPoll', async () => {
    calls++
    return { stdout: null, stderr: null, compile_output: 'syntax error', message: null,
      status: { id: 6, description: 'Compilation Error' }, time: null, memory: null }
  })
  const untouched = candidate('Untouched starter code')
  const baseBroken = candidate('Broken code')
  const broken = { ...baseBroken, testCases: [...baseBroken.testCases, { input: '3', expectedOutput: '1' }] }
  const results = await gradeProgrammingPracticeSet([
    { sourceCode: untouched.starterCode, question: untouched },
    { sourceCode: '   ', question: untouched },
    { sourceCode: 'class Main { broken }', question: broken },
  ])
  assert.deepEqual(results, [
    { passedTestCases: 0, totalTestCases: 2, score: 0 },
    { passedTestCases: 0, totalTestCases: 2, score: 0 },
    { passedTestCases: 0, totalTestCases: 3, score: 0 },
  ])
  assert.equal(calls, 3)
})
