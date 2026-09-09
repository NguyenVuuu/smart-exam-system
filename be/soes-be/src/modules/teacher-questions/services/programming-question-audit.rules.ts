import {
  isIntegerInRange,
  requiredIssue,
  warningIssue,
} from './question-audit.issue'
import type { AuditableQuestion, QuestionAuditIssue } from './question-audit.types'

const auditProgrammingLimits = (question: AuditableQuestion): QuestionAuditIssue[] => {
  const issues: QuestionAuditIssue[] = []
  if (!isIntegerInRange(question.timeLimitMs, 100, 60_000)) {
    issues.push(requiredIssue(
      'TIME_LIMIT_INVALID',
      'timeLimitMs',
      'Giới hạn thời gian phải từ 100 đến 60.000 ms.',
    ))
  }
  if (!isIntegerInRange(question.memoryLimitMb, 16, 2_048)) {
    issues.push(requiredIssue(
      'MEMORY_LIMIT_INVALID',
      'memoryLimitMb',
      'Giới hạn bộ nhớ phải từ 16 đến 2.048 MB.',
    ))
  }
  if (!isIntegerInRange(question.maxCodeSizeKb, 1, 1_024)) {
    issues.push(requiredIssue(
      'CODE_SIZE_LIMIT_INVALID',
      'maxCodeSizeKb',
      'Kích thước mã nguồn tối đa phải từ 1 đến 1.024 KB.',
    ))
  }
  return issues
}

const auditProgrammingTests = (question: AuditableQuestion): QuestionAuditIssue[] => {
  if (question.testCases.length === 0) {
    return [requiredIssue(
      'TEST_CASE_REQUIRED',
      'testCases',
      'Bài lập trình phải có ít nhất một test case.',
    )]
  }

  const issues: QuestionAuditIssue[] = []
  if (!question.testCases.some(({ isHidden }) => !isHidden)) {
    issues.push(requiredIssue(
      'PUBLIC_TEST_CASE_REQUIRED',
      'testCases',
      'Bài lập trình phải có ít nhất một test case công khai.',
    ))
  }
  if (question.testCases.some(({ expectedOutput }) => !expectedOutput.trim())) {
    issues.push(requiredIssue(
      'TEST_EXPECTED_OUTPUT_REQUIRED',
      'testCases',
      'Mỗi test case phải có kết quả mong đợi.',
    ))
  }
  const testKeys = question.testCases.map(({ input, expectedOutput }) =>
    `${input.trim()}\u0000${expectedOutput.trim()}`)
  if (new Set(testKeys).size !== testKeys.length) {
    issues.push(warningIssue(
      'TEST_CASE_DUPLICATED',
      'testCases',
      'Có test case trùng dữ liệu đầu vào và kết quả.',
    ))
  }
  return issues
}

export const auditProgrammingQuestion = (
  question: AuditableQuestion,
): QuestionAuditIssue[] => {
  const issues: QuestionAuditIssue[] = []
  if (!question.content?.trim()) {
    issues.push(requiredIssue(
      'PROGRAMMING_CONTENT_REQUIRED',
      'content',
      'Bài lập trình phải có mô tả bài toán.',
    ))
  }
  if (!question.language) {
    issues.push(requiredIssue(
      'PROGRAMMING_LANGUAGE_REQUIRED',
      'language',
      'Bài lập trình chưa chọn ngôn ngữ.',
    ))
  }
  if (question.options.length > 0) {
    issues.push(requiredIssue(
      'PROGRAMMING_OPTIONS_NOT_ALLOWED',
      'options',
      'Bài lập trình không được chứa phương án trắc nghiệm.',
    ))
  }
  issues.push(...auditProgrammingLimits(question), ...auditProgrammingTests(question))
  return issues
}
