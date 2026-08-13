import { ConflictError, NotFoundError } from '../../../errors/AppError'
import type { StartExamResult } from '../types'
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
