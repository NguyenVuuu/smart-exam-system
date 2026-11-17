import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ValidationError } from '../../../errors/AppError'
import { judge0Service } from '../../../lib/judge0'
import { collectVerifiedProgrammingQuestions, verifyProgrammingDraft } from './programming-practice.service'

type Candidate = Awaited<ReturnType<Parameters<typeof collectVerifiedProgrammingQuestions>[1]>>[number]

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

test('returns only programming questions whose reference solution passes every Judge case', async (context) => {
  const valid = candidate('Bài hợp lệ qua toàn bộ test case')
  const invalid = candidate('Bài có expected output không khớp')
  let submission = 0
  context.mock.method(judge0Service, 'submitAndPoll', async () => {
    submission += 1
    const accepted = submission <= valid.testCases.length
    return {
      stdout: accepted ? '1' : '0', stderr: null, compile_output: null, message: null,
      status: { id: accepted ? 3 : 4, description: accepted ? 'Accepted' : 'Wrong Answer' },
      time: '0.01', memory: 1024,
    }
  })

  assert.deepEqual(await verifyProgrammingDraft([valid, invalid], 'JAVA'), [valid])
})
