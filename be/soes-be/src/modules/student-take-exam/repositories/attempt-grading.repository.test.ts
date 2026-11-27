import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Prisma } from '@prisma/client'
import prisma from '../../../lib/prisma'
import { gradeObjectiveAnswers } from './attempt-grading.repository'

test('objective grading batches scores and preserves partial-credit and release rules', async context => {
  const grades: Prisma.Sql[] = []
  const totals: Array<Record<string, unknown>> = []
  let releaseMode = 'MANUAL'
  let programmingScore: number | null = 2
  const question = (id: string, type: string, points: number) => ({ examQuestion: {
    id, type, points, options: [
      { id: 'a', content: 'A', isCorrect: true },
      { id: 'b', content: 'B', isCorrect: type === 'MULTIPLE_CHOICE' },
      { id: 'c', content: 'C', isCorrect: false },
    ],
  } })
  const client = {
    examAttempt: {
      findUniqueOrThrow: async () => ({
        manualScore: 7, examSchedule: { resultReleaseMode: releaseMode },
        attemptQuestions: [question('single', 'SINGLE_CHOICE', 2),
          question('multi', 'MULTIPLE_CHOICE', 4), question('code', 'PROGRAMMING', 2)],
        studentAnswers: [
          { id: 's', examQuestionId: 'single', selectedOptionIds: ['a'], score: null },
          { id: 'm', examQuestionId: 'multi', selectedOptionIds: ['a', 'c'], score: null },
          { id: 'p', examQuestionId: 'code', selectedOptionIds: [], score: programmingScore },
        ],
      }),
      update: async ({ data }: { data: Record<string, unknown> }) => { totals.push(data); return data },
    },
    $executeRaw: async (strings: TemplateStringsArray, rows: Prisma.Sql, attemptId: string) => {
      assert.match(strings.join('?'), /UPDATE "StudentAnswer"/)
      assert.equal(attemptId, 'attempt')
      grades.push(rows)
      return 2
    },
  }
  context.mock.method(prisma, '$transaction', async (run: (tx: typeof client) => Promise<unknown>) => run(client))

  await gradeObjectiveAnswers('attempt')
  assert.equal(grades.length, 1)
  assert.deepEqual(grades[0].values, ['s', true, 2, 'm', false, 2])
  assert.equal(totals[0].totalScore, 6)
  assert.equal(totals[0].manualScore, 7)
  assert.equal(totals[0].status, 'GRADED')

  releaseMode = 'IMMEDIATE'
  await gradeObjectiveAnswers('attempt')
  assert.equal(totals[1].status, 'PUBLISHED')
  assert.equal(totals[1].manualScore, 6)

  programmingScore = null
  await gradeObjectiveAnswers('attempt')
  assert.equal(totals[2].status, 'GRADING')
  assert.equal(totals[2].totalScore, 4)
})
