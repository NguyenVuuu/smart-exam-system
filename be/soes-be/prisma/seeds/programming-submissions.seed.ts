import { PrismaClient, ProgrammingSubmission, ExamAttempt, ExamQuestion, ProgrammingTestCase } from '@prisma/client'

interface ProgrammingSubmissionSeedInput {
  attempts: ExamAttempt[]
  examQuestions: ExamQuestion[]
}

// Deterministic status based on student+question
function deterministicStatus(studentId: string, examQuestionId: string): 'ACCEPTED' | 'WRONG_ANSWER' | 'RUNTIME_ERROR' {
  let hash = 0
  const str = studentId + examQuestionId
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff
  }
  const mod = Math.abs(hash) % 10
  if (mod < 6) return 'ACCEPTED'
  if (mod < 8) return 'WRONG_ANSWER'
  return 'RUNTIME_ERROR'
}

export async function seedProgrammingSubmissions(
  prisma: PrismaClient,
  { attempts, examQuestions }: ProgrammingSubmissionSeedInput,
): Promise<void> {
  console.log('Seeding ProgrammingSubmissions...')

  let total = 0

  // Only process programming questions (questions without options in the source question)
  const programmingQuestions = examQuestions.filter((eq) => eq.type === 'PROGRAMMING')

  // Fetch all test cases for programming questions
  const programmingQuestionIds = programmingQuestions.map((eq) => eq.id)
  const testCases: ProgrammingTestCase[] = await prisma.programmingTestCase.findMany({
    where: { examQuestionId: { in: programmingQuestionIds } },
  })
  
  // Count test cases per exam question
  const testCaseCountByQuestion = new Map<string, number>()
  for (const tc of testCases) {
    testCaseCountByQuestion.set(tc.examQuestionId, (testCaseCountByQuestion.get(tc.examQuestionId) || 0) + 1)
  }

  for (const attempt of attempts) {
    // Find programming questions for this exam
    const examProgrammingQuestions = programmingQuestions.filter((eq) => eq.examId === attempt.examId)

    for (const eq of examProgrammingQuestions) {
      const existing = await prisma.programmingSubmission.findFirst({
        where: { attemptId: attempt.id, examQuestionId: eq.id },
      })
      if (existing) continue

      const status = deterministicStatus(attempt.studentId, eq.id)
      const totalTestCases = testCaseCountByQuestion.get(eq.id) || 0
      const passedTestCases = status === 'ACCEPTED' ? totalTestCases : Math.floor(totalTestCases * 0.5)

      await prisma.programmingSubmission.create({
        data: {
          clientRequestId: `req-${attempt.id}-${eq.id}-${total}`,
          submissionNo: 1,
          sourceCode: `public class Solution {\n    public int sum(int a, int b) {\n        return a + b;\n    }\n}`,
          language: 'JAVA',
          status,
          score: status === 'ACCEPTED' ? '10.00' : '0.00',
          passedTestCases,
          totalTestCases,
          executionTimeMs: 45,
          memoryUsedKb: 1024,
          compilerOutput: status !== 'ACCEPTED' ? 'Compilation failed' : null,
          runtimeError: status === 'RUNTIME_ERROR' ? 'NullPointerException' : null,
          attemptId: attempt.id,
          examQuestionId: eq.id,
        },
      })
      total++
    }
  }

  console.log(`✓ ProgrammingSubmissions completed (${total} created)`)
}
