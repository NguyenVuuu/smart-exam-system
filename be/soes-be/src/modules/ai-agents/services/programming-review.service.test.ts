import assert from 'node:assert/strict'
import { mock, test } from 'node:test'
import { encryptField } from '../../../lib/encryption'
import * as audit from '../../audit-logs/audit-log.writer'
import * as repo from '../repositories/programming-review.repository'
import * as agent from './ai-agent.client'
import { reviewProgrammingSubmission } from './programming-review.service'

test('programming review sends readable exam text and submitted source code', async () => {
  const previousKey = process.env.EXAM_ENCRYPTION_KEY
  process.env.EXAM_ENCRYPTION_KEY = '2'.repeat(64)
  const submission = {
    id: 'submission-1', sourceCode: 'int main() { return 0; }', language: 'C', status: 'ACCEPTED',
    passedTestCases: 1, totalTestCases: 1, compilerOutput: null, testResults: [],
    examQuestion: { title: encryptField('Tính tổng'), content: encryptField('Nhập n và in tổng.') },
  }
  const find = mock.method(repo, 'findReviewableSubmission', async () => submission as never)
  const write = mock.method(audit, 'writeAuditLog', async () => undefined as never)
  const payloads: Record<string, unknown>[] = []
  const request = mock.method(agent, 'requestProgrammingReviewAgent', async (value: unknown) => {
    payloads.push(value as Record<string, unknown>)
    return { summary: 'Đạt', suggestions: [], caveat: 'Điểm Judge không thay đổi.' } as never
  })
  try {
    await reviewProgrammingSubmission('teacher-1', 'user-1', 'attempt-1', 'question-1')
    assert.equal(payloads[0]?.questionTitle, 'Tính tổng')
    assert.equal(payloads[0]?.questionContent, 'Nhập n và in tổng.')
    assert.equal(payloads[0]?.sourceCode, submission.sourceCode)
  } finally {
    find.mock.restore()
    write.mock.restore()
    request.mock.restore()
    if (previousKey === undefined) delete process.env.EXAM_ENCRYPTION_KEY
    else process.env.EXAM_ENCRYPTION_KEY = previousKey
  }
})
