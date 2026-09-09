import { normalizeAuditText, requiredIssue } from './question-audit.issue'
import type { AuditableQuestion, QuestionAuditIssue } from './question-audit.types'

const auditOptionContent = (
  question: AuditableQuestion,
  normalizedOptions: string[],
): QuestionAuditIssue[] => {
  const issues: QuestionAuditIssue[] = []
  if (question.options.length < 2 || question.options.length > 20) {
    issues.push(requiredIssue(
      'OPTION_COUNT_INVALID', 'options', 'Câu trắc nghiệm phải có từ 2 đến 20 phương án.',
    ))
  }
  if (normalizedOptions.some((content) => !content)) {
    issues.push(requiredIssue(
      'OPTION_CONTENT_REQUIRED', 'options', 'Phương án trả lời không được để trống.',
    ))
  }
  const nonEmptyOptions = normalizedOptions.filter(Boolean)
  if (new Set(nonEmptyOptions).size !== nonEmptyOptions.length) {
    issues.push(requiredIssue(
      'OPTION_CONTENT_DUPLICATED', 'options', 'Các phương án trả lời không được trùng nhau.',
    ))
  }
  return issues
}

const auditCorrectOptions = (question: AuditableQuestion): QuestionAuditIssue[] => {
  const correctCount = question.options.filter(({ isCorrect }) => isCorrect).length
  if (question.type === 'MULTIPLE_CHOICE' && correctCount === 0) {
    return [requiredIssue(
      'MULTIPLE_CHOICE_CORRECT_OPTION_REQUIRED',
      'options',
      'Câu nhiều đáp án phải có ít nhất một đáp án đúng.',
    )]
  }
  if (question.type === 'MULTIPLE_CHOICE' && correctCount === question.options.length) {
    return [requiredIssue(
      'MULTIPLE_CHOICE_INCORRECT_OPTION_REQUIRED',
      'options',
      'Câu nhiều đáp án phải có ít nhất một đáp án sai.',
    )]
  }
  if (question.type !== 'MULTIPLE_CHOICE' && correctCount !== 1) {
    return [requiredIssue(
      'SINGLE_CORRECT_OPTION_REQUIRED', 'options', 'Câu hỏi phải có đúng một đáp án đúng.',
    )]
  }
  return []
}

const auditTrueFalseOptions = (
  question: AuditableQuestion,
  normalizedOptions: string[],
): QuestionAuditIssue[] => {
  if (question.type !== 'TRUE_FALSE') return []
  const labels = [...normalizedOptions].sort().join('|')
  if (question.options.length === 2 && labels === ['đúng', 'sai'].sort().join('|')) return []
  return [requiredIssue(
    'TRUE_FALSE_OPTIONS_INVALID',
    'options',
    'Câu đúng/sai chỉ được có hai phương án Đúng và Sai.',
  )]
}

export const auditObjectiveQuestion = (
  question: AuditableQuestion,
): QuestionAuditIssue[] => {
  const normalizedOptions = question.options.map(({ content }) => normalizeAuditText(content))
  const issues = [
    ...auditOptionContent(question, normalizedOptions),
    ...auditCorrectOptions(question),
    ...auditTrueFalseOptions(question, normalizedOptions),
  ]
  if (question.testCases.length > 0) {
    issues.push(requiredIssue(
      'OBJECTIVE_TEST_CASES_NOT_ALLOWED',
      'testCases',
      'Câu trắc nghiệm không được chứa test case lập trình.',
    ))
  }
  return issues
}
