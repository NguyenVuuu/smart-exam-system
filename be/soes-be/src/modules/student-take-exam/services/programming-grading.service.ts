import type {
  ProgrammingSubmissionStatus,
  ProgrammingTestResultStatus,
} from '@prisma/client'
import { Judge0Service, judge0Service } from '../../../lib/judge0'
import type { Judge0SubmissionResult } from '../../../lib/judge0'
import * as repo from '../repositories/programming-grading.repository'

const BATCH_SIZE = 5

async function runBatched<T, R>(items: T[], run: (item: T) => Promise<R>) {
  const results: R[] = []
  for (let index = 0; index < items.length; index += BATCH_SIZE) {
    results.push(...await Promise.all(items.slice(index, index + BATCH_SIZE).map(run)))
  }
  return results
}

const testStatus = (result: Judge0SubmissionResult): ProgrammingTestResultStatus =>
  Judge0Service.mapStatusToInternal(result.status.id)

function submissionStatus(results: Judge0SubmissionResult[]): ProgrammingSubmissionStatus {
  if (results.some(({ status }) => status.id === 13)) return 'SYSTEM_ERROR'
  if (results.some(({ status }) => status.id === 6)) return 'COMPILE_ERROR'
  if (results.every(({ status }) => status.id === 3)) return 'ACCEPTED'
  const firstFailure = results.find(({ status }) => status.id !== 3)!
  const mapped = testStatus(firstFailure)
  return mapped === 'PASSED' ? 'ACCEPTED' : mapped
}

export async function gradeProgrammingAnswers(attemptId: string) {
  const attempt = await repo.findProgrammingAnswers(attemptId)
  const codeByQuestion = new Map(
    attempt.studentAnswers.map(({ examQuestionId, draftSourceCode }) => [examQuestionId, draftSourceCode ?? '']),
  )

  for (const { examQuestion } of attempt.attemptQuestions) {
    const sourceCode = codeByQuestion.get(examQuestion.id) ?? ''
    const config = examQuestion.programmingConfig
    const language = examQuestion.language
    const tests = examQuestion.programmingTests
    if (!sourceCode.trim() || !language || !config || !tests.length) {
      await repo.saveProgrammingGrade({
        attemptId, questionId: examQuestion.id, sourceCode,
        language: language ?? 'JAVA', status: 'WRONG_ANSWER', score: 0,
        passedTestCases: 0, totalTestCases: tests.length,
        compilerOutput: null, runtimeError: null, testResults: [],
      })
      continue
    }

    if (Buffer.byteLength(sourceCode, 'utf8') > config.maxCodeSizeKb * 1024) {
      await repo.saveProgrammingGrade({
        attemptId, questionId: examQuestion.id, sourceCode, language,
        status: 'WRONG_ANSWER', score: 0, passedTestCases: 0,
        totalTestCases: tests.length, compilerOutput: null,
        runtimeError: 'Source code exceeds maximum allowed size', testResults: [],
      })
      continue
    }

    const results = await runBatched(tests, async (test) => {
      try {
        return await judge0Service.submitAndPoll({
          source_code: sourceCode,
          language_id: language,
          stdin: test.input,
          expected_output: test.expectedOutput,
          cpu_time_limit: config.timeLimitMs / 1000,
          memory_limit: config.memoryLimitKb,
        })
      } catch (error) {
        return {
          stdout: null, stderr: null, compile_output: null,
          message: error instanceof Error ? error.message : 'Judge0 system error',
          status: { id: 13, description: 'System Error' }, time: null, memory: null,
        }
      }
    })
    const status = submissionStatus(results)
    const passed = results.filter(({ status: resultStatus }) => resultStatus.id === 3).length
    const score = status === 'SYSTEM_ERROR'
      ? null
      : status === 'ACCEPTED' ? Number(examQuestion.points) : 0

    await repo.saveProgrammingGrade({
      attemptId, questionId: examQuestion.id, sourceCode, language, status, score,
      passedTestCases: passed, totalTestCases: tests.length,
      compilerOutput: results.find(({ status: resultStatus }) => resultStatus.id === 6)?.compile_output ?? null,
      runtimeError: results.find(({ stderr }) => stderr)?.stderr ?? null,
      testResults: results.map((result, index) => ({
        testCaseId: tests[index].id,
        status: testStatus(result),
        actualOutput: result.stdout,
        executionTimeMs: result.time ? Math.round(Number(result.time) * 1000) : null,
        memoryUsedKb: result.memory,
        errorMessage: result.stderr ?? result.compile_output ?? result.message,
      })),
    })
  }
}
