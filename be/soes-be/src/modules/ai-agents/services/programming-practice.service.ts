import { AppError, ValidationError } from '../../../errors/AppError'
import { Judge0Service, judge0Service } from '../../../lib/judge0'
import { programmingPracticeQuestionSchema } from '../validators/ai-agent.validator'
import type { z } from 'zod'

type ProgrammingQuestion = z.infer<typeof programmingPracticeQuestionSchema>

export function wantsProgrammingPractice(instruction?: string): boolean {
  const text = (instruction ?? '').toLocaleLowerCase('vi-VN')
  if (/dự đoán|trắc nghiệm|chọn đáp án|đọc hiểu|tìm lỗi/.test(text)) return false
  return /viết\s+(?:mã|code|chương trình|hàm)|lập trình\s+(?:bài|chương trình|giải thuật)|bài\s+(?:tập\s+)?lập trình|chạy\s+judge/.test(text)
}

export function practiceLanguage(instruction: string | undefined, subjectName: string): 'C' | 'CPP' | 'JAVA' {
  const detect = (text: string) => {
    if (/(?:\bC\+\+|\bCPP\b)/i.test(text)) return 'CPP'
    if (/\bJava\b/i.test(text)) return 'JAVA'
    if (/\bC\b/.test(text)) return 'C'
    return null
  }
  const language = detect(instruction ?? '') ?? detect(subjectName)
  if (language) return language
  throw new ValidationError('Bài viết mã chỉ hỗ trợ tài liệu môn C, C++ hoặc Java')
}

async function runCase(sourceCode: string, language: ProgrammingQuestion['language'],
  test: ProgrammingQuestion['testCases'][number]): Promise<boolean> {
  const result = await judge0Service.submitAndPoll({
    source_code: sourceCode, language_id: language, stdin: test.input,
    expected_output: test.expectedOutput, cpu_time_limit: 2, memory_limit: 128000,
  })
  if (result.status.id === 13) throw new AppError(503, 'Judge tạm thời không khả dụng')
  return Judge0Service.mapResultToInternal(result, test.expectedOutput) === 'PASSED'
}

export async function verifyProgrammingDraft(questions: ProgrammingQuestion[], language: ProgrammingQuestion['language']) {
  for (const question of questions) {
    if (question.language !== language || new Set(question.testCases.map((test) => test.input)).size !== question.testCases.length) {
      throw new ValidationError('Bài lập trình AI tạo chưa hợp lệ')
    }
  }
  try {
    for (let start = 0; start < questions.length; start += 3) {
      const valid = await Promise.all(questions.slice(start, start + 3).map(async (question) => {
        const results = await Promise.all(question.testCases.map((test) => runCase(question.referenceSolution, language, test)))
        return results.every(Boolean)
      }))
      if (!valid.every(Boolean)) throw new ValidationError('Bài lập trình AI tạo chưa vượt qua test case')
    }
  } catch (error) {
    if (error instanceof ValidationError || error instanceof AppError) throw error
    throw new AppError(503, 'Không thể kiểm tra bài lập trình với Judge')
  }
}

export async function gradeProgrammingPractice(sourceCode: string, question: ProgrammingQuestion) {
  try {
    const results = await Promise.all(question.testCases.map((test) => runCase(sourceCode, question.language, test)))
    const passedTestCases = results.filter(Boolean).length
    return { score: Number(passedTestCases === question.testCases.length), passedTestCases,
      totalTestCases: question.testCases.length }
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError(503, 'Không thể chấm bài lập trình với Judge')
  }
}
