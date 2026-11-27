import { ConflictError, NotFoundError, ValidationError } from '../../../errors/AppError'
import { examConfig } from '../../../config'
import { judge0Service, Judge0Service } from '../../../lib/judge0'
import type { Judge0Submission, Judge0SubmissionResult } from '../../../lib/judge0'
import * as repo from '../repositories/student-take-exam.repository'
import type { RunCodeResult, RunCodeTestCase } from '../types'
import { isAlreadySubmittedStatus } from './attempt-status.policy'

async function runInBatches<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = []
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(fn))
    results.push(...batchResults)
  }
  return results
}

const JUDGE0_RUN_BATCH_SIZE = 5

type RunCodeAttempt = {
  deadlineAt: Date
  examSession: { lastHeartbeat: Date } | null
}

type RunCodeTest = {
  id: string
  input: string
  expectedOutput: string
  isSample: boolean
  isHidden: boolean
}

function remainingSecondsUntil(endAt: Date, now: Date) {
  return Math.max(0, Math.floor((endAt.getTime() - now.getTime()) / 1000))
}

function isAttemptOnline(attempt: RunCodeAttempt, now: Date) {
  return attempt.examSession !== null &&
    (now.getTime() - attempt.examSession.lastHeartbeat.getTime()) <= examConfig.heartbeatTimeoutMs
}

function systemErrorResult(error: unknown): Judge0SubmissionResult {
  return {
    stdout: null,
    stderr: null,
    compile_output: 'System error during code execution',
    message: error instanceof Error ? error.message : 'Unknown error',
    status: { id: 13, description: 'System Error' },
    time: null,
    memory: null,
  }
}

function buildRunCodeSubmissions(
  sourceCode: string,
  language: string,
  tests: RunCodeTest[],
  config: { timeLimitMs?: number; memoryLimitKb?: number } | null,
): Judge0Submission[] {
  const timeLimitMs = config?.timeLimitMs ?? 2000
  const memoryLimitKb = config?.memoryLimitKb ?? 256 * 1024

  return tests.map((test) => ({
    source_code: sourceCode,
    language_id: language,
    stdin: test.input,
    expected_output: test.expectedOutput,
    cpu_time_limit: timeLimitMs / 1000,
    memory_limit: memoryLimitKb,
  }))
}

async function runJudge0Submissions(submissions: Judge0Submission[]) {
  return runInBatches(
    submissions,
    JUDGE0_RUN_BATCH_SIZE,
    async (submission) => {
      try {
        return await judge0Service.submitAndPoll(submission)
      } catch (error) {
        return systemErrorResult(error)
      }
    },
  )
}

function buildEmptyRunCodeResult(
  questionId: string,
  attempt: RunCodeAttempt,
  now: Date,
): RunCodeResult {
  return {
    questionId,
    remainingSeconds: remainingSecondsUntil(attempt.deadlineAt, now),
    isOnline: isAttemptOnline(attempt, now),
    compilationStatus: 'COMPILED',
    compilerOutput: null,
    runtimeError: null,
    hasSystemError: false,
    summary: {
      passedCount: 0,
      totalCount: 0,
      message: 'Không có test case nào để kiểm tra',
    },
    hiddenTestCaseCount: 0,
    testCases: [],
  }
}

function buildRunCodeResult(
  questionId: string,
  attempt: RunCodeAttempt,
  tests: RunCodeTest[],
  judge0Results: Judge0SubmissionResult[],
  now: Date,
): RunCodeResult {
  let compilationStatus: RunCodeResult['compilationStatus'] = 'COMPILED'
  let compilerOutput: string | null = null
  let runtimeError: string | null = null
  let passedCount = 0
  const testCases: RunCodeTestCase[] = []
  const hiddenTestCaseCount = tests.filter((test) => !test.isSample || test.isHidden).length

  for (const [index, test] of tests.entries()) {
    const result = judge0Results[index]
    if (result.status.id === 6) {
      compilationStatus = 'COMPILE_ERROR'
      compilerOutput = result.compile_output || result.stderr || 'Compilation failed'
      break
    }

    const status = Judge0Service.mapResultToInternal(result, test.expectedOutput)
    if (status === 'PASSED') passedCount++
    if (!runtimeError && test.isSample && ['RUNTIME_ERROR', 'TIME_LIMIT_EXCEEDED', 'MEMORY_LIMIT_EXCEEDED'].includes(status)) {
      runtimeError = result.stderr || result.message || 'Runtime error occurred'
    }

    const shouldRevealTestCase = test.isSample && !test.isHidden

    if (shouldRevealTestCase) {
      testCases.push({
        testCaseId: test.id,
        isSample: true,
        status,
        input: test.input,
        expectedOutput: test.expectedOutput,
        actualOutput: result.stdout,
        executionTimeMs: parseFloat(result.time || '0') * 1000,
        memoryUsedKb: result.memory || 0,
      })
    }
  }

  const hasSystemError =
    compilationStatus !== 'COMPILE_ERROR' &&
    judge0Results.some((result) => result.status.id === 13)
  const totalCount = compilationStatus === 'COMPILE_ERROR' ? 0 : tests.length

  return {
    questionId,
    remainingSeconds: remainingSecondsUntil(attempt.deadlineAt, now),
    isOnline: isAttemptOnline(attempt, now),
    compilationStatus,
    compilerOutput,
    runtimeError,
    hasSystemError,
    summary: {
      passedCount: compilationStatus === 'COMPILE_ERROR' ? 0 : passedCount,
      totalCount,
      message: compilationStatus === 'COMPILE_ERROR'
        ? 'Biên dịch thất bại'
        : `Bạn đã pass ${passedCount}/${tests.length} test cases`,
    },
    hiddenTestCaseCount: compilationStatus === 'COMPILE_ERROR' ? 0 : hiddenTestCaseCount,
    testCases,
  }
}

export async function runCode(
  scheduleId: string,
  attemptId: string,
  questionId: string,
  studentId: string,
  sourceCode: string,
): Promise<RunCodeResult> {
  const now = new Date()

  const data = await repo.findProgrammingQuestionWithTestCases(
    questionId,
    attemptId,
    scheduleId,
    studentId,
  )
  if (!data) {
    throw new NotFoundError("Attempt not found")
  }

  const { attempt, question } = data

  if (!question) throw new NotFoundError("Question not found in this attempt")

  if (attempt.status !== "IN_PROGRESS") {
    if (isAlreadySubmittedStatus(attempt.status)) {
      throw new ConflictError("Exam attempt has already been submitted")
    }
    throw new ConflictError("Exam attempt has ended")
  }

  if (now >= attempt.deadlineAt) {
    throw new ConflictError("Exam attempt has ended")
  }

  if (question.type !== "PROGRAMMING") {
    throw new ValidationError("Question is not a programming question")
  }
  if (!['JAVA', 'C', 'CPP'].includes(question.language)) {
    throw new ValidationError("Unsupported programming language")
  }

  const maxCodeSizeKb = question.programmingQuestionConfig?.maxCodeSizeKb ?? 64
  if (Buffer.byteLength(sourceCode, 'utf8') > maxCodeSizeKb * 1024) {
    throw new ValidationError("Source code exceeds maximum allowed size")
  }

  await repo.saveAnswer(attemptId, questionId, [], sourceCode)

  const testCases = question.programmingTestCases
  if (testCases.length === 0) {
    return buildEmptyRunCodeResult(questionId, attempt, now)
  }

  const submissions = buildRunCodeSubmissions(
    sourceCode,
    question.language,
    testCases,
    question.programmingQuestionConfig,
  )
  const judge0Results = await runJudge0Submissions(submissions)
  return buildRunCodeResult(questionId, attempt, testCases, judge0Results, now)
}
