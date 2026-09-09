import type {
  QuestionAuditIssue,
  QuestionAuditIssueCode,
} from './question-audit.types'

export const requiredIssue = (
  code: QuestionAuditIssueCode,
  field: string,
  message: string,
): QuestionAuditIssue => ({ code, severity: 'HIGH', field, message })

export const warningIssue = (
  code: QuestionAuditIssueCode,
  field: string,
  message: string,
): QuestionAuditIssue => ({ code, severity: 'LOW', field, message })

export const normalizeAuditText = (text: string) =>
  text.trim().toLocaleLowerCase('vi')

export const isIntegerInRange = (
  value: number | null | undefined,
  min: number,
  max: number,
) => typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
