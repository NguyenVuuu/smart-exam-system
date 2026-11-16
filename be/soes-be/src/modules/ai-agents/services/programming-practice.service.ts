import { AppError, ValidationError } from '../../../errors/AppError'
import { Judge0Service, judge0Service } from '../../../lib/judge0'
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
    const generated = await generate(missing, attemptedStems.slice(-20).map((stem) => stem.slice(0, 300)))
    const novel = generated.filter((question) => {
      const key = normalizedStem(question.stem)
      if (attemptedKeys.has(key)) return false
      attemptedKeys.add(key)
      attemptedStems.push(question.stem)
      return true
    })
    const verified = await verify(novel)
    accepted.push(...verified.slice(0, missing))
    logger.info('AI programming practice Judge verification completed', {
      attempt, requested: missing, generated: generated.length, novel: novel.length,
      accepted: verified.length, remaining: desiredCount - accepted.length,
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
  const result = await judge0Service.submitAndPoll({
    source_code: sourceCode, language_id: language, stdin: test.input,
    expected_output: test.expectedOutput, cpu_time_limit: 2, memory_limit: 128000,
  })
  if (result.status.id === 13) throw new AppError(503, 'Judge tạm thời không khả dụng')
  const outcome = Judge0Service.mapResultToInternal(result, test.expectedOutput)
  return { passed: outcome === 'PASSED', outcome, judgeStatus: result.status.description }
}

export async function runProgrammingPracticeSample(sourceCode: string, question: ProgrammingQuestion) {
  const sample = question.testCases[0]
  try {
    const result = await judge0Service.submitAndPoll({
      source_code: sourceCode, language_id: question.language, stdin: sample.input,
      expected_output: sample.expectedOutput, cpu_time_limit: 2, memory_limit: 128000,
    })
    if (result.status.id === 13) throw new AppError(503, 'Judge tạm thời không khả dụng')
    return { passed: Judge0Service.mapResultToInternal(result, sample.expectedOutput) === 'PASSED',
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
  try {
    for (let start = 0; start < questions.length; start += 3) {
      const batch = questions.slice(start, start + 3)
      const valid = await Promise.all(batch.map(async (question, batchIndex) => {
        const questionIndex = start + batchIndex
        if (question.language !== language ||
          new Set(question.testCases.map((test) => test.input)).size !== question.testCases.length) {
          logger.warn('AI programming practice failed structural verification', { questionIndex })
          return false
        }
        const results = await Promise.all(question.testCases.map((test) => runCase(question.referenceSolution, language, test)))
        results.forEach((result, testCaseIndex) => {
          if (!result.passed) logger.warn('AI programming practice failed Judge verification', {
            questionIndex, testCaseIndex, outcome: result.outcome, judgeStatus: result.judgeStatus,
          })
        })
        return results.every((result) => result.passed)
      }))
      valid.forEach((passed, index) => {
        if (passed) verified.push(batch[index])
      })
    }
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError(503, 'Không thể kiểm tra bài lập trình với Judge')
  }
  return verified
}

export async function gradeProgrammingPractice(sourceCode: string, question: ProgrammingQuestion) {
  try {
    const results = await Promise.all(question.testCases.map((test) => runCase(sourceCode, question.language, test)))
    const passedTestCases = results.filter((result) => result.passed).length
    return { score: Number(passedTestCases === question.testCases.length), passedTestCases,
      totalTestCases: question.testCases.length }
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError(503, 'Không thể chấm bài lập trình với Judge')
  }
}
