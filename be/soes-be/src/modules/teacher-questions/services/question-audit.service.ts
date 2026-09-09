import { ForbiddenError } from '../../../errors/AppError'
import { toPagination } from '../../../utils/pagination'
import type { QuestionAuditItemDto, QuestionAuditSummaryDto } from '../dtos/teacher-question.dto'
import { toTeacherQuestionDto } from '../mappers/teacher-question.mapper'
import * as repo from '../repositories/teacher-questions.repository'
import type { QuestionAuditQuery } from '../validators/teacher-questions.validator'
import {
  auditQuestion,
  classifyAuditIssues,
  type AuditableQuestion,
  type QuestionAuditIssue,
  type QuestionAuditSeverity,
} from './question-audit.rules'

interface AuditedQuestion {
  questionId: string
  title: string
  content: string
  subjectName: string
  issues: QuestionAuditIssue[]
  severity: QuestionAuditSeverity | null
}

const toAuditableQuestion = (
  question: repo.QuestionAuditCandidate,
): AuditableQuestion => ({
  title: question.title,
  content: question.content,
  explanation: question.explanation,
  type: question.type,
  language: question.language,
  options: question.options,
  timeLimitMs: question.programmingConfig?.timeLimitMs,
  memoryLimitMb: question.programmingConfig
    ? Math.round(question.programmingConfig.memoryLimitKb / 1024)
    : undefined,
  maxCodeSizeKb: question.programmingConfig?.maxCodeSizeKb,
  testCases: question.programmingTests,
})

const summarizeAudit = (questions: AuditedQuestion[]): QuestionAuditSummaryDto => {
  const summary: QuestionAuditSummaryDto = {
    auditedQuestionCount: questions.length,
    requiredQuestionCount: 0,
    warningQuestionCount: 0,
    qualifiedQuestionCount: 0,
    issueCount: 0,
  }
  questions.forEach(({ issues, severity }) => {
    summary.issueCount += issues.length
    if (severity === 'HIGH') summary.requiredQuestionCount += 1
    else if (severity === 'LOW') summary.warningQuestionCount += 1
    else summary.qualifiedQuestionCount += 1
  })
  return summary
}

const matchesKeyword = (entry: AuditedQuestion, keyword?: string) => {
  if (!keyword) return true
  const searchableText = [
    entry.title,
    entry.content,
    entry.subjectName,
    ...entry.issues.map(({ message }) => message),
  ].join(' ').toLocaleLowerCase('vi')
  return searchableText.includes(keyword.toLocaleLowerCase('vi'))
}

const auditCandidates = (
  candidates: repo.QuestionAuditCandidate[],
): AuditedQuestion[] => candidates.map((question) => {
  const issues = auditQuestion(toAuditableQuestion(question))
  return {
    questionId: question.id,
    title: question.title,
    content: question.content,
    subjectName: question.subject.name,
    issues,
    severity: classifyAuditIssues(issues),
  }
})

const loadPageItems = async (
  teacherId: string,
  pageEntries: Array<AuditedQuestion & { severity: QuestionAuditSeverity }>,
): Promise<QuestionAuditItemDto[]> => {
  const questionRows = await repo.listOwnedQuestionsByIds(
    teacherId,
    pageEntries.map(({ questionId }) => questionId),
  )
  const questionById = new Map(
    questionRows.map((row) => [row.id, toTeacherQuestionDto(row)]),
  )
  return pageEntries.map(({ questionId, issues, severity }) => ({
    question: questionById.get(questionId)!,
    issues,
    severity,
  }))
}

export const listQuestionAudit = async (
  teacherId: string,
  query: QuestionAuditQuery,
) => {
  const teacher = await repo.teacherDepartment(teacherId)
  if (!teacher?.departmentId) throw new ForbiddenError('Teacher department is required')

  const candidates = await repo.listQuestionAuditCandidates(teacherId)
  const auditedQuestions = auditCandidates(candidates)
  const problematicQuestions = auditedQuestions.filter(
    (entry): entry is AuditedQuestion & { severity: QuestionAuditSeverity } =>
      entry.severity !== null,
  )
  const matchingQuestions = problematicQuestions.filter((entry) =>
    (!query.severity || entry.severity === query.severity) && matchesKeyword(entry, query.keyword),
  )
  const pagination = toPagination(query.page, query.pageSize, matchingQuestions.length)
  const currentPage = Math.min(query.page, pagination.totalPages)
  const offset = (currentPage - 1) * query.pageSize
  const pageEntries = matchingQuestions.slice(offset, offset + query.pageSize)
  const items = await loadPageItems(teacherId, pageEntries)

  return {
    items,
    summary: summarizeAudit(auditedQuestions),
    matchingIssueCount: matchingQuestions.reduce(
      (issueCount, { issues }) => issueCount + issues.length,
      0,
    ),
    pagination: { ...pagination, page: currentPage },
  }
}
