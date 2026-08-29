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
      password:         true,   // needed for password-protected exams
      examQuestions: {
        select: { id: true, points: true },
      },
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
 * Loads an attempt with the exam details, the question snapshot, and the
 * student's current answers (for state restoration on reload).
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
      id:           true,
      examId:       true,
      studentId:    true,
      startedAt:    true,
      attemptEndAt: true,
      status:       true,
      exam: {
        select: {
          title:           true,
          durationMinutes: true,
          endTime:         true,
          blockCopyPaste:  true,
          blockRightClick: true,
        },
      },
      // snapshot ordered by displayOrder ASC — source of truth for question order
      attemptQuestions: {
        orderBy: { displayOrder: 'asc' },
        select: {
          displayOrder:   true,
          examQuestionId: true,
          shuffledOptionIds: true,
          examQuestion: {
            select: {
              id:      true,
              content: true,
              type:    true,
              language: true, 
              // options ordered by orderIndex ASC for deterministic result
              options: {
                orderBy: { orderIndex: 'asc' },
                select: {
                  id:      true,
                  content: true,
                },
              },
            },
          },
        },
      },
      // load saved answers for state restoration — selectedOptionIds and draftSourceCode
      studentAnswers: {
        select: {
          examQuestionId:   true,
          selectedOptionIds: true,
          draftSourceCode:  true,
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
  const examQuestions = await prisma.examQuestion.findMany({
    where:  { examId, id: { in: attempt.attemptQuestions.map((aq) => aq.examQuestion.id) } },
    select: { id: true, points: true },
  })
  const pointsMap = new Map(examQuestions.map((eq) => [eq.id, Number(eq.points)]))

  // build answer lookup: examQuestionId → StudentAnswer
  const answerMap = new Map(attempt.studentAnswers.map((sa) => [sa.examQuestionId, sa]))

  return { attempt, pointsMap, answerMap }
}


export interface CreateAttemptInput {
  examId:           string
  studentId:        string
  startedAt:        Date
  attemptEndAt:     Date
  remainingSeconds: number
  shuffleQuestions: boolean
  ipAddress:        string   
  deviceInfo:       string   
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
  const { examId, studentId, startedAt, attemptEndAt, remainingSeconds, shuffleQuestions } = input

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
    // ── Fetch exam and exam questions ──────────────────────────────────────
    // const exam = await tx.exam.findUnique({
    //   where: { id: examId },
    //   select: { durationMinutes: true },
    // })

    // if (!exam) {
    //   throw new Error('EXAM_NOT_FOUND')
    // }
    // Use deterministic ordering (id asc) so the non-shuffled case is stable.
    const examQuestions = await tx.examQuestion.findMany({
      where: { examId },
      select: { id: true },
      orderBy: { id: 'asc' },
    })

    // ── Compute attemptEndAt and remainingSeconds ───────────────────────────
    // attemptEndAt is the authoritative exam deadline, stored in DB.
    // remainingSeconds is a snapshot for countdown initialization only.
    // These values are computed from startedAt + exam.durationMinutes and
    // will NOT be updated during the attempt. Clients should recalculate
    // remainingSeconds on each API call based on current time.
    //const attemptEndAt = new Date(startedAt.getTime() + exam.durationMinutes * 60 * 1000)
    
    const attempt = await tx.examAttempt.create({
      data: {
        examId,
        studentId,
        attemptNo:       1,
        startedAt,
        attemptEndAt,    // Authoritative deadline - computed, not updated later
        remainingSeconds, // Snapshot for countdown init - not updated during attempt
        lastSavedAt:     startedAt,
        status:          'IN_PROGRESS',
      },
      select: {
        id:               true,
        startedAt:        true,
        remainingSeconds: true,
      },
    })
    // ── Create ExamSession ─────────────────────────────────────────────────────
    await tx.examSession.create({
      data: {
        attemptId:     attempt.id,
        lastHeartbeat: startedAt,
        isOnline:      true,
        ipAddress:     input.ipAddress, 
        deviceInfo:    input.deviceInfo,
      },
    })

    // ── Fetch all options for shuffling if exam.shuffleOptions is true ─────
    const examQuestionsWithOptions = await tx.examQuestion.findMany({
      where: { examId },
      select: {
        id: true,
        options: {
          select: { id: true }
        }
      }
    })

    // ── Create ExamAttemptQuestion snapshot ───────────────────────────────
    // Apply shuffle when the exam is configured to do so; otherwise preserve
    // the stable ordering determined above.
    const orderedQuestions = shuffleQuestions
      ? shuffleArray([...examQuestions])
      : examQuestions

    // Check if options should be shuffled (needs exam info)
    const examDetails = await tx.exam.findUnique({
      where: { id: examId },
      select: { shuffleOptions: true }
    })
    const shuffleOptions = examDetails?.shuffleOptions ?? false

    if (orderedQuestions.length > 0) {
      await tx.examAttemptQuestion.createMany({
        data: orderedQuestions.map((eq, index) => {
          // Find options for this exam question
          const eqWithOpts = examQuestionsWithOptions.find(q => q.id === eq.id)
          const optionIds = eqWithOpts?.options?.map(o => o.id) ?? []
          
          // Shuffle options if configured
          const shuffledOptionIds = optionIds.length > 0 && shuffleOptions
            ? shuffleArray([...optionIds])
            : optionIds

          return {
            attemptId:     attempt.id,
            examQuestionId: eq.id,
            displayOrder:  index + 1,
            shuffledOptionIds: shuffledOptionIds,
          }
        }),
      })
    }

    return attempt
  })
}

// ─── API 5: Get Attempt Status ────────────────────────────────────────────────

export interface AttemptStatusData {
  id:             string
  examId:         string
  studentId:      string
  status:         string
  startedAt:      Date
  attemptEndAt:   Date
  submittedAt:    Date | null
  endedBy:        string | null
  lastSavedAt:    Date | null
  examSession:    { lastHeartbeat: Date } | null
  _count: {
    studentAnswers:   number
    attemptQuestions: number
  }
}

/**
 * Loads an ExamAttempt with session and counts needed for API 5 (Get Attempt Status).
 * Returns null when the attempt does not exist, does not belong to the given examId,
 * or does not belong to the given studentId.
 */
export async function findAttemptStatus(
  attemptId: string,
  examId:    string,
  studentId: string,
): Promise<AttemptStatusData | null> {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id:           true,
      examId:       true,
      studentId:    true,
      status:       true,
      startedAt:    true,
      attemptEndAt: true,
      submittedAt:  true,
      endedBy:      true,
      lastSavedAt:  true,
      // One-to-one: ExamAttempt -> ExamSession
      examSession: {
        select: { lastHeartbeat: true },
      },
      // Count StudentAnswer records for this attempt
      _count: {
        select: {
          studentAnswers:   true,
          attemptQuestions: true,
        },
      },
    },
  })

  if (!attempt)                         return null
  if (attempt.examId    !== examId)     return null
  if (attempt.studentId !== studentId)  return null

  return {
    id:           attempt.id,
    examId:       attempt.examId,
    studentId:    attempt.studentId,
    status:       attempt.status,
    startedAt:    attempt.startedAt,
    attemptEndAt: attempt.attemptEndAt,
    submittedAt:  attempt.submittedAt,
    endedBy:      attempt.endedBy,
    lastSavedAt:  attempt.lastSavedAt,
    examSession:  attempt.examSession,
    _count: {
      studentAnswers:   attempt._count.studentAnswers,
      attemptQuestions: attempt._count.attemptQuestions,
    },
  }
}


// ─── API 6: Send Heartbeat ───────────────────────────────────────────────────

export async function upsertExamSessionHeartbeat(
  attemptId: string,
  lastHeartbeat: Date,
): Promise<void> {
  await prisma.examSession.upsert({
    where: { attemptId },
    update: { lastHeartbeat },
    create: {
      attemptId,
      lastHeartbeat,
      isOnline: true,
      ipAddress: 'unknown', // API 6 doesn't receive ipAddress/deviceInfo
      deviceInfo: 'unknown',
    },
  })
}

export async function findAttemptForHeartbeat(
  attemptId: string,
  examId: string,
  studentId: string,
): Promise<{
  id: string
  status: string
  attemptEndAt: Date
  examSession: { lastHeartbeat: Date } | null
} | null> {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      examId: true,
      studentId: true,
      status: true,
      attemptEndAt: true,
      examSession: {
        select: { lastHeartbeat: true },
      },
    },
  })

  if (!attempt) return null
  if (attempt.examId !== examId) return null
  if (attempt.studentId !== studentId) return null

  return {
    id: attempt.id,
    status: attempt.status,
    attemptEndAt: attempt.attemptEndAt,
    examSession: attempt.examSession,
  }
}

// ─── API 7: Run Code ─────────────────────────────────────────────────────────

export interface ProgrammingQuestionData {
  id: string
  type: string
  language: string
  programmingQuestionConfig: {
    maxCodeSizeKb: number
    timeLimitMs: number
    memoryLimitKb: number
  } | null
  programmingTestCases: Array<{
    id: string
    isSample: boolean
    input: string
    expectedOutput: string
  }>
}

export async function findProgrammingQuestionWithTestCases(
  questionId: string,
  attemptId: string,
  examId: string,
  studentId: string,
): Promise<{
  attempt: {
    id: string
    status: string
    attemptEndAt: Date
    examSession: { lastHeartbeat: Date } | null
  }
  question: ProgrammingQuestionData | null
} | null> {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      examId: true,
      studentId: true,
      status: true,
      attemptEndAt: true,
      examSession: {
        select: { lastHeartbeat: true },
      },
      attemptQuestions: {
        where: { examQuestionId: questionId },
        select: {
          examQuestion: {
            select: {
              id: true,
              type: true,
              language: true,
              programmingConfig: {
                select: {
                  maxCodeSizeKb: true,
                  timeLimitMs: true,
                  memoryLimitKb: true,
                },
              },
              programmingTests: {
                select: {
                  id: true,
                  isSample: true,
                  input: true,
                  expectedOutput: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!attempt) return null
  if (attempt.examId !== examId) return null
  if (attempt.studentId !== studentId) return null

  const attemptQuestion = attempt.attemptQuestions[0]
  if (!attemptQuestion) return null

  return {
    attempt: {
      id: attempt.id,
      status: attempt.status,
      attemptEndAt: attempt.attemptEndAt,
      examSession: attempt.examSession,
    },
    question: attemptQuestion.examQuestion.type === 'PROGRAMMING' ? {
      id: attemptQuestion.examQuestion.id,
      type: attemptQuestion.examQuestion.type,
      language: attemptQuestion.examQuestion.language || 'UNKNOWN',
      programmingQuestionConfig: attemptQuestion.examQuestion.programmingConfig,
      programmingTestCases: attemptQuestion.examQuestion.programmingTests,
    } : null,
  }
}

export async function upsertStudentAnswerForProgramming(
  attemptId: string,
  questionId: string,
  draftSourceCode: string,
): Promise<void> {
  await prisma.studentAnswer.upsert({
    where: {
      attemptId_examQuestionId: {
        attemptId,
        examQuestionId: questionId,
      },
    },
    update: { draftSourceCode },
    create: {
      attemptId,
      examQuestionId: questionId,
      draftSourceCode,
      selectedOptionIds: [],
    },
  })
}

export async function updateAttemptLastSavedAt(
  attemptId: string,
  lastSavedAt: Date,
): Promise<void> {
  await prisma.examAttempt.update({
    where: { id: attemptId },
    data: { lastSavedAt },
  })
}
