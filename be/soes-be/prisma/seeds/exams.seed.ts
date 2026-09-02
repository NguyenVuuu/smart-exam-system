import {
  Exam,
  ExamCreationMethod,
  ExamFormat,
  ExamStatus,
  ExamType,
  PrismaClient,
  Question,
  Semester,
  Subject,
  Teacher,
} from '@prisma/client'
import { FIXED_EXAMS, getQuizCount } from './seed.config'

interface ExamSeedInput {
  subjects: Subject[]
  teachers: Teacher[]
  semesters: Semester[]
}

interface ExamSpec {
  key: string
  titleSuffix: string
  type: ExamType
  durationMinutes: number
  status: ExamStatus
  creationMethod: ExamCreationMethod
}

function getFormat(questions: Question[]): ExamFormat {
  const hasProgramming = questions.some((question) => question.type === 'PROGRAMMING')
  const hasObjective = questions.some((question) => question.type !== 'PROGRAMMING')
  if (hasProgramming && hasObjective) return ExamFormat.MIXED
  return hasProgramming ? ExamFormat.PROGRAMMING : ExamFormat.OBJECTIVE
}

async function createQuestionSnapshots(prisma: PrismaClient, examId: string, questions: Question[]) {
  if (await prisma.examQuestion.count({ where: { examId } })) return

  const sourceQuestions = await prisma.question.findMany({
    where: { id: { in: questions.map((question) => question.id) } },
    include: { options: { orderBy: { orderIndex: 'asc' } } },
  })

  for (const [index, question] of sourceQuestions.entries()) {
    const isProgramming = question.type === 'PROGRAMMING'
    await prisma.examQuestion.create({
      data: {
        examId,
        orderIndex: index,
        title: question.title,
        content: question.content,
        explanation: question.explanation,
        type: question.type,
        difficulty: question.difficulty,
        language: question.language,
        sourceQuestionId: question.id,
        points: '2.00',
        options: isProgramming
          ? undefined
          : {
              create: question.options.map((option, optionIndex) => ({
                orderIndex: optionIndex,
                content: option.content,
                isCorrect: option.isCorrect,
              })),
            },
        programmingTests: isProgramming
          ? {
              create: [
                { input: '5\n3', expectedOutput: '8', isHidden: false },
                { input: '10\n20', expectedOutput: '30', isHidden: false },
                { input: '-5\n10', expectedOutput: '5', isHidden: true },
                { input: '0\n0', expectedOutput: '0', isHidden: true },
              ],
            }
          : undefined,
        programmingConfig: isProgramming
          ? { create: { timeLimitMs: 2000, memoryLimitKb: 262144, maxCodeSizeKb: 256 } }
          : undefined,
      },
    })
  }
}

function getExamSpecs(subjectCode: string): ExamSpec[] {
  const quizzes = Array.from({ length: getQuizCount(subjectCode) }, (_, index) => ({
    key: `quiz-${index + 1}`,
    titleSuffix: `Thường kỳ ${index + 1}`,
    type: ExamType.QUIZ,
    durationMinutes: 45,
    status: ExamStatus.READY,
    creationMethod: ExamCreationMethod.MANUAL,
  }))
  return [...quizzes, ...FIXED_EXAMS]
}

export async function seedExams(
  prisma: PrismaClient,
  { subjects, teachers, semesters }: ExamSeedInput,
): Promise<Exam[]> {
  console.log('Seeding Exams...')

  const exams: Exam[] = []
  const semester = semesters.find(({ status }) => status === 'ACTIVE') ?? semesters[0]
  if (!semester) throw new Error('At least one semester is required before seeding exams')
  for (const [subjectIndex, subject] of subjects.entries()) {
    const teacher = teachers[subjectIndex % teachers.length]
    const questions = await prisma.question.findMany({
      where: { subjectId: subject.id },
      orderBy: { createdAt: 'asc' },
      take: 5,
    })

    for (const spec of getExamSpecs(subject.code)) {
      const id = `exam-${subject.code.toLowerCase()}-${spec.key}`
      const data = {
        title: `${subject.name} - ${spec.titleSuffix}`,
        description: `Bài thi ${spec.titleSuffix} môn ${subject.name}`,
        subjectId: subject.id,
        semesterId: semester.id,
        defaultDurationMinutes: spec.durationMinutes,
        totalPoints: '10.00',
        format: getFormat(questions),
        status: spec.status,
        creationMethod: spec.creationMethod,
        type: spec.type,
        createdById: teacher.id,
      }
      const exam = await prisma.exam.upsert({
        where: { id },
        update: data,
        create: {
          id,
          ...data,
          approvalStatus: spec.type === ExamType.FINAL ? 'APPROVED' : 'NOT_REQUIRED',
        },
      })

      await createQuestionSnapshots(prisma, exam.id, questions)
      exams.push(exam)
    }
  }

  console.log(`✓ Exams completed (${exams.length})`)
  return exams
}
