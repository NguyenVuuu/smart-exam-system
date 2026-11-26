import { AppError, ValidationError } from '../../../errors/AppError'
import { judge0Service } from '../../../lib/judge0'
import { logger } from '../../../lib/logger'
import { programmingPracticeQuestionSchema } from '../validators/ai-agent.validator'
import type { z } from 'zod'

export type ProgrammingQuestion = z.infer<typeof programmingPracticeQuestionSchema>

const MAX_GENERATION_ATTEMPTS = 3

function normalizedStem(stem: string) {
  return stem.trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi-VN')
}

export async function collectVerifiedProgrammingQuestions(desiredCount: number,
  generate: (missing: number, excludedStems: string[]) => Promise<ProgrammingQuestion[]>,
  verify: (questions: ProgrammingQuestion[]) => Promise<ProgrammingQuestion[]>) {
  const accepted: ProgrammingQuestion[] = []
  const attemptedStems: string[] = []
  const attemptedKeys = new Set<string>()

  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS && accepted.length < desiredCount; attempt += 1) {
    const missing = desiredCount - accepted.length
    const generationStarted = Date.now()
    const generated = await generate(missing, attemptedStems.slice(-20).map((stem) => stem.slice(0, 300)))
    const generationMs = Date.now() - generationStarted
    const novel = generated.filter((question) => {
      const key = normalizedStem(question.stem)
      if (attemptedKeys.has(key)) return false
      attemptedKeys.add(key)
      attemptedStems.push(question.stem)
      return true
    })
    const verificationStarted = Date.now()
    const verified = await verify(novel)
    const judgeMs = Date.now() - verificationStarted
    accepted.push(...verified.slice(0, missing))
    logger.info('AI programming practice Judge verification completed', {
      attempt, requested: missing, generated: generated.length, novel: novel.length,
      accepted: verified.length, remaining: desiredCount - accepted.length, generationMs, judgeMs,
    })

  }

  if (accepted.length < desiredCount) {
    throw new ValidationError('AI chưa tạo đủ bài lập trình vượt qua kiểm thử. Vui lòng thử lại')
  }
  return accepted
}

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
  test: ProgrammingQuestion['testCases'][number]) {
  try {
    const result = await judge0Service.submitAndPoll({
      source_code: sourceCode, language_id: language, stdin: test.input,
      expected_output: test.expectedOutput, cpu_time_limit: 2, memory_limit: 128000,
    })
    if (result.status.id === 13) throw new AppError(503, 'Judge tạm thời không khả dụng')
    const actualOutput = (result.stdout ?? '').trim().replace(/\r\n/g, '\n')
    const expectedOutput = (test.expectedOutput ?? '').trim().replace(/\r\n/g, '\n')
    const passed = (result.status.id === 3 || result.status.id === 4) && actualOutput === expectedOutput
    return { passed, outcome: passed ? 'PASSED' : 'WRONG_ANSWER', judgeStatus: result.status.description, isUnavailable: false }
  } catch (error) {
    logger.warn('Judge0 submission error during practice verification', { error: error instanceof Error ? error.message : String(error) })
    return { passed: false, outcome: 'ERROR', judgeStatus: 'Judge unavailable', isUnavailable: true }
  }
}

export async function runProgrammingPracticeSample(sourceCode: string, question: ProgrammingQuestion) {
  const sample = question.testCases[0]
  try {
    const result = await judge0Service.submitAndPoll({
      source_code: sourceCode, language_id: question.language, stdin: sample.input,
      expected_output: sample.expectedOutput, cpu_time_limit: 2, memory_limit: 128000,
    })
    if (result.status.id === 13) throw new AppError(503, 'Judge tạm thời không khả dụng')
    const actualOutput = (result.stdout ?? '').trim().replace(/\r\n/g, '\n')
    const expectedOutput = (sample.expectedOutput ?? '').trim().replace(/\r\n/g, '\n')
    const passed = (result.status.id === 3 || result.status.id === 4) && actualOutput === expectedOutput
    return { passed,
      output: (result.stdout ?? '').slice(0, 4000),
      error: (result.compile_output ?? result.stderr ?? '').slice(0, 4000),
      status: result.status.description }
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError(503, 'Không thể chạy thử với Judge')
  }
}

export async function verifyProgrammingDraft(questions: ProgrammingQuestion[], language: ProgrammingQuestion['language']) {
  const verified: ProgrammingQuestion[] = []
  for (const [questionIndex, question] of questions.entries()) {
    if (question.language !== language || !question.testCases.length ||
      new Set(question.testCases.map(test => test.input)).size !== question.testCases.length) {
      logger.warn('AI programming practice failed structural verification', { questionIndex })
      continue
    }
    let passed = true
    for (let start = 0; start < question.testCases.length; start += 5) {
      const results = await Promise.all(question.testCases.slice(start, start + 5)
        .map(test => runCase(question.referenceSolution, language, test)))
      if (results.some(result => result.isUnavailable)) {
        throw new AppError(503, 'Judge tạm thời không khả dụng; chưa thể xác minh bài lập trình')
      }
      if (results.some(result => !result.passed)) {
        passed = false
        logger.warn('AI programming practice failed Judge verification', { questionIndex, testBatch: start / 5 })
        break
      }
    }
    if (passed) verified.push(question)
  }
  return verified
}

export async function gradeProgrammingPractice(sourceCode: string, question: ProgrammingQuestion) {
  try {
    const results = await Promise.all(question.testCases.map((test) => runCase(sourceCode, question.language, test)))
    if (results.some(result => result.isUnavailable)) throw new AppError(503, 'Không thể chấm bài lập trình với Judge')
    const passedTestCases = results.filter((result) => result.passed).length
    return { score: Number(passedTestCases === question.testCases.length), passedTestCases,
      totalTestCases: question.testCases.length }
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError(503, 'Không thể chấm bài lập trình với Judge')
  }
}
