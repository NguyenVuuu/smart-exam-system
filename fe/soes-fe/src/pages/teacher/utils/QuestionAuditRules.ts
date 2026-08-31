import type { Question } from '../types/teacher-question-bank.types'

export interface AuditIssue {
  id: string
  questionId: string
  subjectName: string
  title: string
  content: string
  severity: 'HIGH' | 'LOW'
  description: string
}

export interface AuditMetrics {
  requiredErrors: number
  warnings: number
  qualifiedCount: number
}

/**
 * Kiểm tra quy tắc kỹ thuật của một câu hỏi theo quy trình rà soát (Mục 8).
 */
export function auditQuestion(question: Question): AuditIssue[] {
  const issues: AuditIssue[] = []
  const base = {
    questionId: question.id,
    subjectName: question.subjectName || 'Chưa phân môn',
    title: question.title || question.content,
    content: question.content,
  }

  // 1. Kiểm tra câu hỏi trắc nghiệm
  if (
    question.type === 'SINGLE_CHOICE' ||
    question.type === 'MULTIPLE_CHOICE' ||
    question.type === 'TRUE_FALSE'
  ) {
    const options = question.options ?? []

    if (options.length < 2) {
      issues.push({
        ...base,
        id: `${question.id}-options-count`,
        severity: 'HIGH',
        description: 'Câu trắc nghiệm phải có ít nhất 2 phương án lựa chọn.',
      })
    }

    const correctCount = options.filter((option) => option.isCorrect).length
    const invalidCorrectCount = question.type === 'MULTIPLE_CHOICE'
      ? correctCount < 1
      : correctCount !== 1
    if (invalidCorrectCount) {
      issues.push({
        ...base,
        id: `${question.id}-correct-count`,
        severity: 'HIGH',
        description: question.type === 'MULTIPLE_CHOICE'
          ? 'Câu nhiều đáp án phải có ít nhất một phương án đúng.'
          : 'Câu hỏi phải có đúng một phương án đúng.',
      })
    }

    if (question.type === 'TRUE_FALSE' && options.length !== 2) {
      issues.push({
        ...base,
        id: `${question.id}-true-false-options`,
        severity: 'HIGH',
        description: 'Câu đúng/sai phải có đúng hai phương án.',
      })
    }

    // Kiểm tra trùng lặp nội dung phương án
    const seen = new Set<string>()
    const hasDuplicate = options.some((opt) => {
      const text = opt.content.trim().toLowerCase()
      if (!text) return false
      if (seen.has(text)) return true
      seen.add(text)
      return false
    })

    if (hasDuplicate) {
      issues.push({
        ...base,
        id: `${question.id}-duplicate-options`,
        severity: 'HIGH',
        description: 'Có phương án bị trùng lặp nội dung.',
      })
    }
  }

  // 2. Kiểm tra câu hỏi lập trình
  if (question.type === 'PROGRAMMING') {
    const testCases = question.testCases ?? []

    if (!question.programmingLanguage) {
      issues.push({
        ...base,
        id: `${question.id}-language`,
        severity: 'HIGH',
        description: 'Bài lập trình chưa chọn ngôn ngữ.',
      })
    }

    if (!question.timeLimitMs || !question.memoryLimitMb) {
      issues.push({
        ...base,
        id: `${question.id}-runtime-config`,
        severity: 'HIGH',
        description: 'Bài lập trình thiếu giới hạn thời gian hoặc bộ nhớ.',
      })
    }

    if (testCases.length === 0) {
      issues.push({
        ...base,
        id: `${question.id}-no-testcases`,
        severity: 'HIGH',
        description: 'Bài lập trình chưa có bộ kiểm thử (test case).',
      })
    } else if (testCases.some((tc) => !tc.expectedOutput || !tc.expectedOutput.trim())) {
      issues.push({
        ...base,
        id: `${question.id}-missing-output`,
        severity: 'HIGH',
        description: 'Test case chưa có kết quả mong đợi (expected output).',
      })
    }

    const testKeys = testCases.map(({ input, expectedOutput }) =>
      `${input.trim()}\u0000${expectedOutput.trim()}`)
    if (new Set(testKeys).size !== testKeys.length) {
      issues.push({
        ...base,
        id: `${question.id}-duplicate-tests`,
        severity: 'LOW',
        description: 'Có test case trùng input và output.',
      })
    }
  }

  // 3. Kiểm tra lời giải thích (Cảnh báo không bắt buộc)
  if (!question.explanation || !question.explanation.trim()) {
    issues.push({
      ...base,
      id: `${question.id}-no-explanation`,
      severity: 'LOW',
      description: 'Thiếu lời giải thích phục vụ xem lại bài thi.',
    })
  }

  return issues
}

/**
 * Quét toàn bộ danh sách câu hỏi.
 */
export function auditQuestions(questions: Question[]): AuditIssue[] {
  return questions.flatMap(auditQuestion)
}

/**
 * Tính toán số liệu thống kê cho 3 thẻ KPI.
 */
export function getAuditMetrics(questions: Question[], issues: AuditIssue[]): AuditMetrics {
  const errorQuestionIds = new Set(
    issues.filter((i) => i.severity === 'HIGH').map((i) => i.questionId),
  )

  return {
    requiredErrors: issues.filter((i) => i.severity === 'HIGH').length,
    warnings: issues.filter((i) => i.severity === 'LOW').length,
    qualifiedCount: questions.filter((q) => !errorQuestionIds.has(q.id)).length,
  }
}
