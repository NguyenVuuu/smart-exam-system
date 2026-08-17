import prisma from '../../../lib/prisma'

// ─── Exam lookup ─────────────────────────────────────────────────────────────

export async function findExamById(examId: string) {
  return prisma.exam.findUnique({
    where: { id: examId },
    select: {
      id:               true,
      status:           true,
      publishedAt:      true,
      startTime:        true,
      endTime:          true,
      durationMinutes:  true,
      maxAttempts:      true,
      courseOfferingId: true,
      shuffleQuestions: true,
    },
  })
}

// ─── Enrollment check ────────────────────────────────────────────────────────

export async function findEnrollment(courseOfferingId: string, studentId: string) {
  return prisma.enrollment.findUnique({
    where: {
      courseOfferingId_studentId: { courseOfferingId, studentId },
    },
    select: { id: true },
  })
}

// ─── Attempt queries ─────────────────────────────────────────────────────────

export async function countAttemptsForExam(examId: string, studentId: string): Promise<number> {
  return prisma.examAttempt.count({
    where: { examId, studentId },
  })
}

// ─── API 2: Get Exam Content ──────────────────────────────────────────────────

/**
 * Loads an attempt with the exam details and the question snapshot.
 * Returns null when the attempt does not exist, does not belong to the
 * given examId, or does not belong to the given studentId.
 */
export async function findAttemptWithContent(
  attemptId: string,
  examId:    string,
  studentId: string,
) {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id:        true,
      examId:    true,
      studentId: true,
      startedAt: true,
      status:    true,
      exam: {
        select: {
          title:           true,
          durationMinutes: true,
          endTime:         true,
        },
      },
      // snapshot ordered by orderIndex ASC — this is the source of truth for question order
      attemptQuestions: {
        orderBy: { orderIndex: 'asc' },
        select: {
          orderIndex: true,
          question: {
            select: {
              id:      true,
              content: true,
              type:    true,
              // isCorrect on options intentionally NOT selected — never expose to student
              options: {
                select: {
                  id:      true,
                  content: true,
                },
              },
            },
          },
        },
      },
    },
  })

  // ownership + relationship guard — return null rather than 403 to avoid
  // leaking the existence of another student's attempt
  if (!attempt)                         return null
  if (attempt.examId    !== examId)     return null
  if (attempt.studentId !== studentId)  return null

  // fetch points per question in one query (points live on ExamQuestion, not Question)
  const questionIds   = attempt.attemptQuestions.map((aq) => aq.question.id)
  const examQuestions = await prisma.examQuestion.findMany({
    where:  { examId, questionId: { in: questionIds } },
    select: { questionId: true, points: true },
  })
  const pointsMap = new Map(examQuestions.map((eq) => [eq.questionId, Number(eq.points)]))

  return { attempt, pointsMap }
}


export interface CreateAttemptInput {
  examId:           string
  studentId:        string
  startedAt:        Date
  remainingSeconds: number
  shuffleQuestions: boolean
}

/**
 * Fisher-Yates in-place shuffle.
 * Returns the same array (mutated) for convenience.
 */
function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export async function createAttemptSafe(input: CreateAttemptInput) {
  const { examId, studentId, startedAt, remainingSeconds, shuffleQuestions } = input

  return prisma.$transaction(async (tx) => {
    // ── Guard: re-check inside transaction ────────────────────────────────
    // Combined with the DB unique constraint on (examId, studentId, attemptNo),
    // this prevents duplicate attempts even under concurrent requests.
    const existing = await tx.examAttempt.count({
      where: { examId, studentId },
    })

    if (existing > 0) {
      const err = new Error('DUPLICATE_ATTEMPT')
      err.name = 'DUPLICATE_ATTEMPT'
      throw err
    }

    // ── Fetch exam questions ───────────────────────────────────────────────
    // Use deterministic ordering (id asc) so the non-shuffled case is stable.
    const examQuestions = await tx.examQuestion.findMany({
      where: { examId },
      select: { questionId: true },
      orderBy: { id: 'asc' },
    })

    // ── Create ExamAttempt ────────────────────────────────────────────────
    const attempt = await tx.examAttempt.create({
      data: {
        examId,
        studentId,
        attemptNo:       1,
        startedAt,
        remainingSeconds,
        lastSavedAt:     startedAt,
        status:          'IN_PROGRESS',
      },
      select: {
        id:               true,
        startedAt:        true,
        remainingSeconds: true,
      },
    })

    // ── Create ExamAttemptQuestion snapshot ───────────────────────────────
    // Apply shuffle when the exam is configured to do so; otherwise preserve
    // the stable ordering determined above.
    const orderedQuestions = shuffleQuestions
      ? shuffleArray([...examQuestions])
      : examQuestions

    if (orderedQuestions.length > 0) {
      await tx.examAttemptQuestion.createMany({
        data: orderedQuestions.map((eq, index) => ({
          attemptId:  attempt.id,
          questionId: eq.questionId,
          orderIndex: index + 1,
        })),
      })
    }

    return attempt
  })
}
