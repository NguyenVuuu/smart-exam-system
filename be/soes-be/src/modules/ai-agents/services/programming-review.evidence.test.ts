import assert from 'node:assert/strict'
import { test } from 'node:test'
import { publicFailedTests } from './programming-review.evidence'

test('only public failed cases become AI evidence', () => {
  const result = publicFailedTests([
    { status: 'WRONG_ANSWER', actualOutput: 'secret output', errorMessage: 'secret error',
      testCase: { input: 'secret input', expectedOutput: 'secret expected', isHidden: true } },
    { status: 'PASSED', actualOutput: '2', errorMessage: null,
      testCase: { input: '1', expectedOutput: '2', isHidden: false } },
    { status: 'WRONG_ANSWER', actualOutput: '3', errorMessage: null,
      testCase: { input: '2', expectedOutput: '4', isHidden: false } },
  ])
  assert.deepEqual(result, [{ input: '2', expectedOutput: '4', actualOutput: '3',
    status: 'WRONG_ANSWER', errorMessage: null }])
  assert.ok(!JSON.stringify(result).includes('secret'))
})
