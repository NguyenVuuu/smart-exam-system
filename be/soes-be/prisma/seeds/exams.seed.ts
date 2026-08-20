import { CourseOffering, Exam, ExamType, PrismaClient, Question, Subject, Teacher } from '@prisma/client'
import {
  FIXED_EXAMS,
  QUIZ_BASE_OFFSET,
  QUIZ_SPACING_DAYS,
  SEED_MODE,
  getQuizCount,
} from './seed.config'

interface ExamSeedInput {
  courseOfferings: CourseOffering[]
  subjects: Subject[]
  teachers: Teacher[]
  questions: Question[]
}

function offsetDate(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

function resolveStatus(realStatus: 'DRAFT' | 'PUBLISHED' | 'CLOSED'): 'DRAFT' | 'PUBLISHED' | 'CLOSED' {
  return SEED_MODE === 'demo' ? 'CLOSED' : realStatus
}

async function upsertExam(
  prisma: PrismaClient,
  data: Parameters<typeof prisma.exam.create>[0]['data'],
): Promise<Exam> {
  const title            = data.title as string
  const courseOfferingId = data.courseOfferingId as string

  const existing = await prisma.exam.findFirst({
    where: { title, courseOfferingId },
  })
  if (existing) return existing

  return prisma.exam.create({ data })
}

// Helper to create exam questions - snapshot từ Question tại thời điểm tạo Exam
function createExamQuestionsData(subjectQuestions: Question[]) {
  return subjectQuestions.map((q: any, idx: number) => {
    // Determine if this is a programming question by checking if it has options
    const isProgramming = q.type === 'PROGRAMMING'
    
    const questionData: any = {
      orderIndex: idx,
      content: q.content,
      type: q.type,
      difficulty: q.difficulty,
      language: q.language,
      sourceQuestionId: q.id,
      points: '2.00',
    }
    
    if (!isProgramming && q.options && q.options.length > 0) {
      questionData.options = {
        create: q.options.map((opt: any, oIdx: number) => ({
          orderIndex: oIdx,
          content: opt.content,
          isCorrect: opt.isCorrect,
        })),
      }
    }
    
    if (isProgramming) {
      questionData.programmingTests = {
        create: [
          { input: '5\n3', expectedOutput: '8', weight: 30.00, isHidden: false },
          { input: '10\n20', expectedOutput: '30', weight: 30.00, isHidden: false },
          { input: '-5\n10', expectedOutput: '5', weight: 20.00, isHidden: true },
          { input: '0\n0', expectedOutput: '0', weight: 20.00, isHidden: true },
        ],
      }
      questionData.programmingConfig = {
        create: { timeLimitMs: 2000, memoryLimitKb: 262144, maxCodeSizeKb: 256 },
      }
    }
    
    return questionData
  })
}

export async function seedExams(
  prisma: PrismaClient,
  { courseOfferings, subjects, teachers, questions }: ExamSeedInput,
): Promise<Exam[]> {
  console.log(`Seeding Exams (mode: ${SEED_MODE})...`)

  const allExams: Exam[] = []

  for (let i = 0; i < courseOfferings.length; i++) {
    const offering = courseOfferings[i]
    const teacher  = teachers[i] ?? teachers[0]
    const subject  = subjects[i] ?? subjects[0]

    const subjectQuestions = questions.filter((q) => q.subjectId === subject.id)
    const examQs           = subjectQuestions.slice(0, 5)

    const quizCount = getQuizCount(subject.code)

    // ── Generate QUIZ exams ────────────────────────────
    for (let q = 0; q < quizCount; q++) {
      const titleSuffix  = quizCount === 1 ? 'Thường kỳ' : `Thường kỳ ${q + 1}`
      const startOffset  = QUIZ_BASE_OFFSET + q * QUIZ_SPACING_DAYS
      const endOffset    = startOffset + 1

      const exam = await upsertExam(prisma, {
        title:                  `${subject.name} - ${titleSuffix}`,
        description:            `Bài thi ${titleSuffix} môn ${subject.name}`,
        type:                   ExamType.QUIZ,
        creationMethod:         'MANUAL',
        startTime:              offsetDate(startOffset),
        endTime:                offsetDate(endOffset),
        durationMinutes:        45,
        maxAttempts:            1,
        shuffleQuestions:       true,
        shuffleOptions:         true,
        showResultImmediately:  true,
        status:                 'CLOSED',       // QUIZ is always CLOSED
        publishedAt:            offsetDate(startOffset - 1), // Published 1 day before start
        requireFullscreen:      true,
        enableWebcam:           false,
        blockCopyPaste:         true,
        blockRightClick:        true,
        courseOfferingId:       offering.id,
        createdById:            teacher.id,
        examQuestions: {
          create: createExamQuestionsData(examQs),
        },
      })
      allExams.push(exam)
    }

    // ── Generate MIDTERM and FINAL ─────────────────────
    for (const spec of FIXED_EXAMS) {
      const status = resolveStatus(spec.realStatus)

      // Determine publishedAt based on status
      let publishedAt: Date | null = null
      if (status === 'PUBLISHED' || status === 'CLOSED') {
        // Published 1-3 days before start time for both demo and real mode
        const publishOffset = spec.startOffset - (1 + Math.floor(Math.random() * 3))
        publishedAt = offsetDate(publishOffset)
      }

      const exam = await upsertExam(prisma, {
        title:                  `${subject.name} - ${spec.titleSuffix}`,
        description:            `Bài thi ${spec.titleSuffix} môn ${subject.name}`,
        type:                   spec.type,
        creationMethod:         spec.creationMethod,
        startTime:              offsetDate(spec.startOffset),
        endTime:                offsetDate(spec.endOffset),
        durationMinutes:        spec.durationMinutes,
        maxAttempts:            1,
        shuffleQuestions:       true,
        shuffleOptions:         true,
        showResultImmediately:  status === 'CLOSED',
        status,
        publishedAt,
        requireFullscreen:      true,
        enableWebcam:           spec.type === 'FINAL',
        blockCopyPaste:         true,
        blockRightClick:        true,
        courseOfferingId:       offering.id,
        createdById:            teacher.id,
        examQuestions: {
          create: createExamQuestionsData(examQs),
        },
      })
      allExams.push(exam)
    }
  }

  console.log(`✓ Exams completed (${allExams.length})`)
  return allExams
}
