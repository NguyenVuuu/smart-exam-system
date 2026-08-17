import { ConflictError, NotFoundError } from '../../../errors/AppError'
import type { StartExamResult, ExamContentResult } from '../types'
import * as repo from '../repositories/student-take-exam.repository'

export async function startExam(examId: string, studentId: string): Promise<StartExamResult> {
  // ── 1. Exam must exist ────────────────────────────────────────────────────
  const exam = await repo.findExamById(examId)
  if (!exam) {
    throw new NotFoundError('Exam not found')
  }

  // ── 2. CourseOffering must exist (exam carries courseOfferingId, which is
  //       always set because of the non-null DB constraint, but we still guard
  //       against a hypothetical null to satisfy business rule 8.2) ──────────
  if (!exam.courseOfferingId) {
    throw new NotFoundError('Course offering not found')
  }

  // ── 3. Student must be enrolled in the exam's course offering ─────────────
  const enrollment = await repo.findEnrollment(exam.courseOfferingId, studentId)
  if (!enrollment) {
    throw new NotFoundError('Not Found')
  }

  // ── 4. Exam must be PUBLISHED ─────────────────────────────────────────────
  if (exam.status !== 'PUBLISHED') {
    throw new ConflictError('Exam is not published')
  }

  // ── 5. Exam must have publishedAt ─────────────────────────────────────────
  if (!exam.publishedAt) {
    throw new ConflictError('Exam has not been published yet')
  }

  // ── 6. Time window: startTime <= now < endTime ────────────────────────────
  const now = new Date()

  if (now < exam.startTime) {
    throw new ConflictError('Exam has not started yet')
  }

  if (now >= exam.endTime) {
    throw new ConflictError('Exam has already ended')
  }

  // ── 7. Attempt limit ──────────────────────────────────────────────────────
  const attemptCount = await repo.countAttemptsForExam(examId, studentId)
  if (attemptCount >= exam.maxAttempts) {
    throw new ConflictError('Maximum attempts reached')
  }

  // ── 8. Compute timing values ──────────────────────────────────────────────
  //
  // Use a single timestamp for all calculations so there are no clock skew
  // issues between startedAt, attemptEndAt, and remainingSeconds.
  const startedAt = now

  const durationEndAt = new Date(startedAt.getTime() + exam.durationMinutes * 60 * 1000)
  const attemptEndAt  = durationEndAt < exam.endTime ? durationEndAt : exam.endTime

  const remainingSeconds = Math.max(
    0,
    Math.floor((attemptEndAt.getTime() - startedAt.getTime()) / 1000),
  )

  // ── 9. Create attempt (safe against concurrent duplicate requests) ─────────
  let attempt: { id: string; startedAt: Date; remainingSeconds: number }

  try {
    attempt = await repo.createAttemptSafe({
      examId,
      studentId,
      startedAt,
      remainingSeconds,
      shuffleQuestions: exam.shuffleQuestions,
    })
  } catch (err) {
    if (err instanceof Error && err.name === 'DUPLICATE_ATTEMPT') {
      throw new ConflictError('You have already started this exam')
    }

    // Prisma unique constraint violation — concurrent request won the race
    const prismaErr = err as { code?: string }
    if (prismaErr.code === 'P2002') {
      throw new ConflictError('You have already started this exam')
    }

    throw err
  }

  return {
    attemptId:        attempt.id,
    startedAt:        attempt.startedAt,
    attemptEndAt,
    remainingSeconds: attempt.remainingSeconds,
  }
}

// ─── API 2: Get Exam Content ──────────────────────────────────────────────────

export async function getExamContent(
  examId:    string,
  attemptId: string,
  studentId: string,
): Promise<ExamContentResult> {
  // ── 1. Load attempt + questions (ownership validated inside repository) ───
  const result = await repo.findAttemptWithContent(attemptId, examId, studentId)
  if (!result) {
    throw new NotFoundError('Attempt not found')
  }

  const { attempt, pointsMap } = result

  // ── 2. Compute attemptEndAt and check expiry ───────────────────────────────
  // attemptEndAt is NEVER stored — always computed from source fields.
  const durationEndAt = new Date(
    attempt.startedAt.getTime() + attempt.exam.durationMinutes * 60 * 1000,
  )
  const attemptEndAt = durationEndAt < attempt.exam.endTime
    ? durationEndAt
    : attempt.exam.endTime

  const now              = new Date()
  const remainingSeconds = Math.max(
    0,
    Math.floor((attemptEndAt.getTime() - now.getTime()) / 1000),
  )

  if (now >= attemptEndAt) {
    throw new ConflictError('Exam attempt has ended')
  }

  // ── 3. Build question list from the attempt's snapshot ────────────────────
  // Source of truth: ExamAttemptQuestion ordered by orderIndex ASC.
  // PROGRAMMING questions get options: [].
  const questions: ExamContentResult['questions'] = attempt.attemptQuestions.map((aq) => {
    const q       = aq.question
    const isProgramming = q.type === 'PROGRAMMING'

    return {
      id:         q.id,
      orderIndex: aq.orderIndex,
      content:    q.content,
      type:       q.type,
      points:     pointsMap.get(q.id) ?? 0,
      options:    isProgramming
        ? []
        : q.options.map((opt) => ({ id: opt.id, content: opt.content })),
    }
  })

  return {
    attemptId:        attempt.id,
    title:            attempt.exam.title,
    durationMinutes:  attempt.exam.durationMinutes,
    remainingSeconds,
    questions,
  }
}
