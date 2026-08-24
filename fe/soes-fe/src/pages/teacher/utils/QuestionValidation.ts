import type { Question } from '../types/teacher-question-bank.types'

export function validateQuestion(question: Partial<Question>): string[] {
  const errors: string[] = []
  const content = question.content?.trim() ?? ''

  if (!question.subjectId) errors.push('Vui lòng chọn môn học.')
  if (!content) errors.push('Nội dung câu hỏi không được để trống.')
  if (!question.type) errors.push('Vui lòng chọn dạng câu hỏi.')
  if (!question.difficulty) errors.push('Vui lòng chọn độ khó.')

  if (question.type === 'PROGRAMMING') {
    const testCases = question.testCases ?? []
    if (!question.programmingLanguage) errors.push('Vui lòng chọn ngôn ngữ lập trình.')
    if (!question.timeLimitMs || question.timeLimitMs <= 0) errors.push('Giới hạn thời gian phải lớn hơn 0.')
    if (!question.memoryLimitMb || question.memoryLimitMb <= 0) errors.push('Giới hạn bộ nhớ phải lớn hơn 0.')
    if (testCases.length === 0) errors.push('Câu lập trình phải có ít nhất một test case.')
    if (testCases.some((testCase) => !testCase.expectedOutput.trim())) {
      errors.push('Mỗi test case phải có kết quả mong đợi.')
    }
    if (testCases.some((testCase) => testCase.weight <= 0)) {
      errors.push('Trọng số test case phải lớn hơn 0.')
    }
    const totalWeight = testCases.reduce((sum, testCase) => sum + testCase.weight, 0)
    if (testCases.length > 0 && Math.abs(totalWeight - 100) >= 0.01) {
      errors.push(`Tổng trọng số test case phải bằng 100% (hiện tại ${totalWeight}%).`)
    }
    return errors
  }

  const options = question.options ?? []
  if (options.length < 2) errors.push('Câu trắc nghiệm phải có ít nhất hai phương án.')
  if (options.some((option) => !option.content.trim())) errors.push('Phương án trả lời không được để trống.')

  const normalizedOptions = options.map((option) => option.content.trim().toLocaleLowerCase('vi'))
  if (new Set(normalizedOptions).size !== normalizedOptions.length) {
    errors.push('Các phương án trả lời không được trùng nhau.')
  }

  const correctCount = options.filter((option) => option.isCorrect).length
  if (question.type === 'MULTIPLE_CHOICE') {
    if (correctCount < 1) errors.push('Câu nhiều đáp án phải có ít nhất một đáp án đúng.')
    if (correctCount === options.length && options.length > 0) errors.push('Câu nhiều đáp án phải có ít nhất một đáp án sai.')
  } else if (correctCount !== 1) {
    errors.push('Câu một đáp án hoặc đúng/sai phải có đúng một đáp án đúng.')
  }

  if (question.type === 'TRUE_FALSE') {
    const labels = normalizedOptions.sort().join('|')
    if (options.length !== 2 || labels !== ['đúng', 'sai'].sort().join('|')) {
      errors.push('Câu đúng/sai chỉ được có hai phương án Đúng và Sai.')
    }
  }

  return errors
}
