import { requiredIssue, warningIssue } from './question-audit.issue'
import { auditObjectiveQuestion } from './objective-question-audit.rules'
import { auditProgrammingQuestion } from './programming-question-audit.rules'
import type {
  AuditableQuestion,
  QuestionAuditIssue,
  QuestionAuditSeverity,
} from './question-audit.types'

export type {
  AuditableQuestion,
  QuestionAuditIssue,
  QuestionAuditIssueCode,
  QuestionAuditSeverity,
} from './question-audit.types'

export const auditQuestion = (question: AuditableQuestion): QuestionAuditIssue[] => {
  const issues: QuestionAuditIssue[] = []
  if (question.title.trim().length < 3 || question.title.trim().length > 200) {
    issues.push(requiredIssue(
      'TITLE_INVALID',
      'title',
      'Tiêu đề câu hỏi phải có từ 3 đến 200 ký tự.',
    ))
  }
  issues.push(...(question.type === 'PROGRAMMING'
    ? auditProgrammingQuestion(question)
    : auditObjectiveQuestion(question)))
  if (!question.explanation?.trim()) {
    issues.push(warningIssue(
      'EXPLANATION_RECOMMENDED',
      'explanation',
      'Nên bổ sung lời giải thích để phục vụ xem lại bài thi.',
    ))
  }
  return issues
}

export const classifyAuditIssues = (
  issues: QuestionAuditIssue[],
): QuestionAuditSeverity | null => {
  if (issues.some(({ severity }) => severity === 'HIGH')) return 'HIGH'
  return issues.length > 0 ? 'LOW' : null
}
