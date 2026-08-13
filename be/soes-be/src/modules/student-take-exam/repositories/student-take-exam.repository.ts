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

// ─── Attempt creation (inside transaction to prevent race conditions) ─────────

export interface CreateAttemptInput {
  examId:           string
  studentId:        string
  startedAt:        Date
  remainingSeconds: number
}

export async function createAttemptSafe(input: CreateAttemptInput) {
  const { examId, studentId, startedAt, remainingSeconds } = input

  return prisma.$transaction(async (tx) => {
    // Re-check inside the transaction — this, combined with the DB unique
    // constraint on (examId, studentId, attemptNo), prevents duplicate attempts
    // even under concurrent requests.
    const existing = await tx.examAttempt.count({
      where: { examId, studentId },
    })

    if (existing > 0) {
      const err = new Error('DUPLICATE_ATTEMPT')
      err.name = 'DUPLICATE_ATTEMPT'
      throw err
    }

    return tx.examAttempt.create({
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
  })
}
