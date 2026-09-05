/**
 * Centralized Validation Rules & Regex Constants for Teacher Module
 */

export const REGEX_PATTERNS = {
  /** Matches positive integers greater than 0 (e.g. 1, 15, 60, 120) */
  POSITIVE_INTEGER: /^[1-9]\d*$/,
  /** Matches positive numbers including decimals (e.g. 0.25, 0.5, 1, 10) */
  POSITIVE_NUMBER: /^(?:0\.\d+|[1-9]\d*(?:\.\d+)?)$/,
  /** Matches non-empty trimmed strings */
  NON_EMPTY: /\S+/,
  /** Matches safe plain text without dangerous characters */
  SAFE_TITLE: /^[\p{L}\p{N}\s\-._()[\]/·,:+]+$/u,
}

export const POSITIVE_INTEGER_REGEX = REGEX_PATTERNS.POSITIVE_INTEGER
export const POSITIVE_NUMBER_REGEX = REGEX_PATTERNS.POSITIVE_NUMBER
export const NON_EMPTY_REGEX = REGEX_PATTERNS.NON_EMPTY


export interface ValidationResult<T extends Record<string, string> = Record<string, string>> {
  isValid: boolean
  errors: T
  firstError?: string
}

/**
 * Validates course announcement form (Tiêu đề và Nội dung)
 */
export function validateAnnouncement(title: string, content: string): ValidationResult<{ title?: string; content?: string }> {
  const errors: { title?: string; content?: string } = {}
  const trimmedTitle = title.trim()
  const trimmedContent = content.trim()

  if (!trimmedTitle) {
    errors.title = 'Vui lòng nhập tiêu đề thông báo.'
  } else if (trimmedTitle.length < 3) {
    errors.title = 'Tiêu đề thông báo phải có ít nhất 3 ký tự.'
  } else if (trimmedTitle.length > 255) {
    errors.title = 'Tiêu đề thông báo không được vượt quá 255 ký tự.'
  }

  if (!trimmedContent) {
    errors.content = 'Vui lòng nhập nội dung thông báo.'
  } else if (trimmedContent.length < 5) {
    errors.content = 'Nội dung thông báo phải có ít nhất 5 ký tự.'
  }

  const isValid = Object.keys(errors).length === 0
  return {
    isValid,
    errors,
    firstError: Object.values(errors)[0],
  }
}

/**
 * Validates exam duration (Thời lượng làm bài)
 */
export function validateDuration(duration: number | string | '' | undefined): { isValid: boolean; error?: string } {
  const durationStr = String(duration ?? '').trim()
  if (!durationStr || !REGEX_PATTERNS.POSITIVE_INTEGER.test(durationStr) || Number(duration) <= 0) {
    return {
      isValid: false,
      error: 'Thời lượng làm bài phải là số nguyên dương lớn hơn 0 (phút).',
    }
  }
  return { isValid: true }
}

/**
 * Validates exam points (Tổng điểm mục tiêu)
 */
export function validatePoints(points: number | string | '' | undefined): { isValid: boolean; error?: string } {
  const pointsStr = String(points ?? '').trim()
  if (!pointsStr || !REGEX_PATTERNS.POSITIVE_NUMBER.test(pointsStr) || Number(points) <= 0) {
    return {
      isValid: false,
      error: 'Tổng điểm mục tiêu phải lớn hơn 0.',
    }
  }
  return { isValid: true }
}

/**
 * Validates auto exam matrix generator configuration
 */
export function validateAutoExamConfig(params: {
  title: string
  durationMinutes: number | '' | undefined
  targetTotalPoints: number | '' | undefined
  selectedSubject: string
  hasValidSemester: boolean
  pickMode: 'AUTO' | 'MANUAL'
  configuredQuestionCount: number
  selectedQuestionCount: number
}): ValidationResult {
  const errors: Record<string, string> = {}
  const trimmedTitle = params.title.trim()

  if (!trimmedTitle) {
    errors.examTitle = 'Vui lòng nhập tên bài thi trước khi sinh đề.'
  } else if (trimmedTitle.length < 3) {
    errors.examTitle = 'Tên bài thi phải có ít nhất 3 ký tự.'
  }

  const durationCheck = validateDuration(params.durationMinutes)
  if (!durationCheck.isValid && durationCheck.error) {
    errors.durationMinutes = durationCheck.error
  }

  const pointsCheck = validatePoints(params.targetTotalPoints)
  if (!pointsCheck.isValid && pointsCheck.error) {
    errors.targetTotalPoints = pointsCheck.error
  }

  if (!params.selectedSubject || !params.hasValidSemester) {
    errors.selectedSubject = 'Không tìm thấy học kỳ/lớp học phần cho môn đã chọn.'
  }

  if (params.pickMode === 'AUTO' && params.configuredQuestionCount === 0) {
    errors.matrix = 'Vui lòng cấu hình số lượng câu hỏi theo độ khó trước khi sinh đề tự động.'
  }

  const isValid = Object.keys(errors).length === 0
  return {
    isValid,
    errors,
    firstError: Object.values(errors)[0],
  }
}
