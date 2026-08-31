import type { Question } from '../types/teacher-question-bank.types'

export function validateQuestion(question: Partial<Question>): string[] {
  const errors: string[] = []
  const title = question.title?.trim() ?? ''
  const content = question.content?.trim() ?? ''

  if (!question.subjectId) errors.push('Vui lòng chọn môn học.')
  if (!title) errors.push('Tiêu đề câu hỏi không được để trống.')
  if (title.length > 200) errors.push('Tiêu đề câu hỏi không được vượt quá 200 ký tự.')
  if (!question.type) errors.push('Vui lòng chọn dạng câu hỏi.')
  if (!question.difficulty) errors.push('Vui lòng chọn độ khó.')

  if (question.type === 'PROGRAMMING') {
    const testCases = question.testCases ?? []
    if (!content) errors.push('Mô tả bài toán không được để trống.')
    if (!question.programmingLanguage) errors.push('Vui lòng chọn ngôn ngữ lập trình.')
    if (!question.timeLimitMs || question.timeLimitMs <= 0) errors.push('Giới hạn thời gian phải lớn hơn 0.')
    if (!question.memoryLimitMb || question.memoryLimitMb <= 0) errors.push('Giới hạn bộ nhớ phải lớn hơn 0.')
    if (!question.maxCodeSizeKb || question.maxCodeSizeKb <= 0) errors.push('Giới hạn mã nguồn phải lớn hơn 0.')
    if (testCases.length === 0) errors.push('Câu lập trình phải có ít nhất một test case.')
    if (testCases.length > 0 && !testCases.some((testCase) => !testCase.isHidden)) {
      errors.push('Câu lập trình phải có ít nhất một test case công khai để sinh viên chạy thử.')
    }
    if (testCases.some((testCase) => !testCase.expectedOutput.trim())) {
      errors.push('Mỗi test case phải có kết quả mong đợi.')
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
