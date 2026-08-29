import type {
  Prisma,
  ProgrammingLanguage,
  QuestionDifficulty,
  QuestionType,
} from '@prisma/client'

export interface SnapshotSource {
  id: string
  content: string
  explanation: string | null
  type: QuestionType
  difficulty: QuestionDifficulty
  language: ProgrammingLanguage | null
  options: Array<{ content: string; isCorrect: boolean; orderIndex?: number }>
  programmingConfig: null | { timeLimitMs: number; memoryLimitKb: number; maxCodeSizeKb: number }
  programmingTests: Array<{
    input: string
    expectedOutput: string
    weight: Prisma.Decimal
    isSample: boolean
    isHidden: boolean
  }>
}

export interface SnapshotInput {
  question: SnapshotSource
  sourceQuestionId?: string | null
  points: number
  orderIndex: number
  sectionId?: string
}

export async function deleteExamQuestions(tx: Prisma.TransactionClient, examId: string) {
  const ids = (await tx.examQuestion.findMany({ where: { examId }, select: { id: true } })).map(({ id }) => id)
  if (!ids.length) return
  await tx.examQuestionOption.deleteMany({ where: { examQuestionId: { in: ids } } })
  await tx.programmingTestCase.deleteMany({ where: { examQuestionId: { in: ids } } })
  await tx.programmingQuestionConfig.deleteMany({ where: { examQuestionId: { in: ids } } })
  await tx.examQuestion.deleteMany({ where: { examId } })
}

export function createExamQuestion(tx: Prisma.TransactionClient, examId: string, input: SnapshotInput) {
  const source = input.question
  return tx.examQuestion.create({
    data: {
      examId,
      sourceQuestionId: input.sourceQuestionId === undefined ? source.id : input.sourceQuestionId,
      orderIndex: input.orderIndex,
      points: input.points,
      sectionId: input.sectionId,
      content: source.content,
      explanation: source.explanation,
      type: source.type,
      difficulty: source.difficulty,
      language: source.language,
      options: {
        create: source.options.map(({ content, isCorrect, orderIndex }, index) => ({
          content,
          isCorrect,
          orderIndex: orderIndex ?? index + 1,
        })),
      },
      ...(source.programmingConfig && {
        programmingConfig: {
          create: {
            timeLimitMs: source.programmingConfig.timeLimitMs,
            memoryLimitKb: source.programmingConfig.memoryLimitKb,
            maxCodeSizeKb: source.programmingConfig.maxCodeSizeKb,
          },
        },
      }),
      programmingTests: {
        create: source.programmingTests.map(({ input, expectedOutput, weight, isSample, isHidden }) => ({
          input,
          expectedOutput,
          weight,
          isSample,
          isHidden,
        })),
      },
    },
  })
}
