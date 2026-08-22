import { ConflictError, NotFoundError, ValidationError } from "../../../errors/AppError";
import prisma from "../../../lib/prisma";
import type { StartExamResult, ExamContentResult, SubmitExamResult } from "../types";
import * as repo from "../repositories/student-take-exam.repository";

export async function startExam(
  examId: string,
  studentId: string,
): Promise<StartExamResult> {
  // ── 1. Exam must exist ────────────────────────────────────────────────────
  const exam = await repo.findExamById(examId);
  if (!exam) {
    throw new NotFoundError("Exam not found");
  }

  // ── 2. CourseOffering must exist (exam carries courseOfferingId, which is
  //       always set because of the non-null DB constraint, but we still guard
  //       against a hypothetical null to satisfy business rule 8.2) ──────────
  if (!exam.courseOfferingId) {
    throw new NotFoundError("Course offering not found");
  }

  // ── 3. Student must be enrolled in the exam's course offering ─────────────
  const enrollment = await repo.findEnrollment(
    exam.courseOfferingId,
    studentId,
  );
  if (!enrollment) {
    throw new NotFoundError("Not Found");
  }

  // ── 4. Exam must be PUBLISHED ─────────────────────────────────────────────
  if (exam.status !== "PUBLISHED") {
    throw new ConflictError("Exam is not published");
  }

  // ── 5. Exam must have publishedAt ─────────────────────────────────────────
  if (!exam.publishedAt) {
    throw new ConflictError("Exam has not been published yet");
  }

  // ── 6. Time window: startTime <= now < endTime ────────────────────────────
  const now = new Date();

  if (now < exam.startTime) {
    throw new ConflictError("Exam has not started yet");
  }

  if (now >= exam.endTime) {
    throw new ConflictError("Exam has already ended");
  }

  // ── 7. Attempt limit ──────────────────────────────────────────────────────
  const attemptCount = await repo.countAttemptsForExam(examId, studentId);
  if (attemptCount >= exam.maxAttempts) {
    throw new ConflictError("Maximum attempts reached");
  }

  // ── 8. Compute timing values ──────────────────────────────────────────────
  //
  // Use a single timestamp for all calculations so there are no clock skew
  // issues between startedAt, attemptEndAt, and remainingSeconds.
  const startedAt = now;

  const durationEndAt = new Date(
    startedAt.getTime() + exam.durationMinutes * 60 * 1000,
  );
  const attemptEndAt =
    durationEndAt < exam.endTime ? durationEndAt : exam.endTime;

  const remainingSeconds = Math.max(
    0,
    Math.floor((attemptEndAt.getTime() - startedAt.getTime()) / 1000),
  );

  // ── 9. Create attempt (safe against concurrent duplicate requests) ─────────
  let attempt: { id: string; startedAt: Date; remainingSeconds: number };

  // Note: attemptEndAt is stored as authoritative deadline in DB.
  // remainingSeconds is stored as a snapshot for countdown initialization only.
  // Both values are computed from startedAt + exam.durationMinutes, not updated later.
  try {
    attempt = await repo.createAttemptSafe({
      examId,
      studentId,
      startedAt,
      remainingSeconds,
      shuffleQuestions: exam.shuffleQuestions,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "DUPLICATE_ATTEMPT") {
      throw new ConflictError("You have already started this exam");
    }

    // Prisma unique constraint violation — concurrent request won the race
    const prismaErr = err as { code?: string };
    if (prismaErr.code === "P2002") {
      throw new ConflictError("You have already started this exam");
    }

    throw err;
  }

  return {
    attemptId: attempt.id,
    startedAt: attempt.startedAt,
    attemptEndAt,
    remainingSeconds: attempt.remainingSeconds,
  };
}

// ─── API 2: Get Exam Content ──────────────────────────────────────────────────

export async function getExamContent(
  examId: string,
  attemptId: string,
  studentId: string,
): Promise<ExamContentResult> {
  // ── 1. Load attempt + questions (ownership validated inside repository) ───
  const result = await repo.findAttemptWithContent(
    attemptId,
    examId,
    studentId,
  );
  if (!result) {
    throw new NotFoundError("Attempt not found");
  }

  const { attempt, pointsMap } = result;

  // ── 2. Check expiry using attemptEndAt from DB ─────────────────────────────
  const now = new Date();
  if (now >= attempt.attemptEndAt) {
    throw new ConflictError("Exam attempt has ended");
  }

  // ── 3. Compute remainingSeconds from attemptEndAt ──────────────────────────
  const remainingSeconds = Math.max(
    0,
    Math.floor((attempt.attemptEndAt.getTime() - now.getTime()) / 1000),
  );

  // ── 4. Build question list from the attempt's snapshot ────────────────────
  // Source of truth: ExamAttemptQuestion ordered by displayOrder ASC.
  // PROGRAMMING questions get options: [].
  const questions: ExamContentResult["questions"] =
    attempt.attemptQuestions.map((aq) => {
      const q = aq.examQuestion;
      const isProgramming = q.type === "PROGRAMMING";

      return {
        id: q.id,
        orderIndex: aq.displayOrder,
        content: q.content,
        type: q.type,
        points: pointsMap.get(q.id) ?? 0,
        options: isProgramming
          ? []
          : q.options.map((opt) => ({ id: opt.id, content: opt.content })),
      };
    });

  return {
    attemptId: attempt.id,
    title: attempt.exam.title,
    durationMinutes: attempt.exam.durationMinutes,
    remainingSeconds,
    attemptEndAt: attempt.attemptEndAt,
    questions,
  };
}

// ─── API 3: Save Answer ───────────────────────────────────────────────────────

export async function saveAnswer(
  examId: string,
  attemptId: string,
  studentId: string,
  questionId: string,
  answer: string | string[],
): Promise<{ questionId: string; remainingSeconds: number }> {
  // ── 1. Load attempt with exam and attempt questions ───────────────────────
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      examId: true,
      studentId: true,
      status: true,
      attemptEndAt: true,
      lastSavedAt: true,
      exam: {
        select: {
          endTime: true,
        },
      },
      attemptQuestions: {
        where: {
          examQuestionId: questionId,
        },
        select: {
          examQuestion: {
            select: {
              id: true,
              type: true,
              options: true,
              language: true,
            },
          },
        },
      },
    },
  });

  // Validate attempt exists and belongs to student and exam
  if (!attempt) {
    throw new NotFoundError("Attempt not found");
  }
  if (attempt.studentId !== studentId) {
    throw new NotFoundError("Attempt not found");
  }
  if (attempt.examId !== examId) {
    throw new NotFoundError("Attempt not found");
  }

  // ── 2. Check attempt status ───────────────────────────────────────────────
  if (attempt.status !== "IN_PROGRESS") {
    throw new ConflictError("Exam attempt has ended");
  }

  // ── 3. Check attemptEndAt ──────────────────────────────────────────────────
  const now = new Date();
  if (now >= attempt.attemptEndAt) {
    throw new ConflictError("Exam attempt has ended");
  }

  // ── 4. Validate question belongs to attempt ────────────────────────────────
  const attemptQuestion = attempt.attemptQuestions[0];
  if (!attemptQuestion) {
    throw new NotFoundError("Question not found in exam attempt");
  }

  const question = attemptQuestion.examQuestion;

  // ── 5. Validate answer based on question type ──────────────────────────────
  let selectedOptionIds: string[] = [];
  let draftSourceCode: string | null = null;

  if (question.type === "SINGLE_CHOICE") {
    if (typeof answer === "string") {
      // Validate answer is not empty
      if (answer.trim() === "") {
        throw new ValidationError("Answer cannot be empty");
      }
      // Validate option belongs to this exam question
      const optionExists = question.options.some((o: { id: string }) => o.id === answer);
      if (!optionExists) {
        throw new ValidationError("Option not found in question");
      }
      selectedOptionIds = [answer];
    } else {
      throw new ValidationError("Invalid answer type for SINGLE_CHOICE");
    }
  } else if (question.type === "MULTIPLE_CHOICE") {
    if (Array.isArray(answer)) {
      // Validate all options belong to this exam question
      const validOptionIds = question.options.map((o: { id: string }) => o.id);
      for (const optionId of answer) {
        if (!validOptionIds.includes(optionId)) {
          throw new ValidationError("Option not found in question");
        }
      }
      // Check for duplicates
      const uniqueOptionIds = [...new Set(answer)];
      if (uniqueOptionIds.length !== answer.length) {
        throw new ValidationError("Duplicate options not allowed");
      }
      selectedOptionIds = answer;
    } else {
      throw new ValidationError("Invalid answer type for MULTIPLE_CHOICE");
    }
  } else if (question.type === "PROGRAMMING") {
    if (typeof answer === "string") {
      draftSourceCode = answer;
    } else {
      throw new ValidationError("Invalid answer type for PROGRAMMING");
    }
  }

  // ── 6. Create or update StudentAnswer atomically ───────────────────────────
  // Using upsert to handle both create and update in a single atomic operation
  await prisma.$transaction([
    prisma.studentAnswer.upsert({
      where: {
        attemptId_examQuestionId: {
          attemptId,
          examQuestionId: questionId,
        },
      },
      update: {
        selectedOptionIds,
        draftSourceCode,
      },
      create: {
        attemptId,
        examQuestionId: questionId,
        selectedOptionIds,
        draftSourceCode,
      },
    }),

    // ── 7. Update lastSavedAt ──────────────────────────────────────────────────
    prisma.examAttempt.update({
      where: { id: attemptId },
      data: { lastSavedAt: now },
    }),
  ]);

  // ── 8. Calculate remainingSeconds (realtime) ──────────────────────────────
  const remainingSeconds = Math.max(
    0,
    Math.floor((attempt.attemptEndAt.getTime() - now.getTime()) / 1000),
  );

  return {
    questionId,
    remainingSeconds,
  };
}

// ─── API 4: Submit Exam ───────────────────────────────────────────────────────

export async function submitExam(
  examId: string,
  attemptId: string,
  studentId: string,
): Promise<SubmitExamResult> {
  const now = new Date();

  // ── Attempt the atomic conditional update ─────────────────────────────────
  //
  // We do a conditional UPDATE inside a transaction:
  //   WHERE id = attemptId
  //     AND examId = examId          (exam ownership)
  //     AND studentId = studentId    (student ownership)
  //     AND status = IN_PROGRESS     (only transition from IN_PROGRESS)
  //     AND attemptEndAt > now       (deadline not yet reached)
  //
  // Prisma's updateMany returns a count. If count === 0 we know the update
  // did not match, and we run a separate lookup to determine the correct
  // error message. The uniqueness of the WHERE conditions and the DB-level
  // unique constraint on (examId, studentId, attemptNo) make this atomic
  // enough to prevent double-submit races — only one concurrent request can
  // win the updateMany with status = IN_PROGRESS.
  //
  // The transition and submittedAt assignment happen in one statement, so
  // no intermediate dirty state is visible to other connections.

  const updated = await prisma.examAttempt.updateMany({
    where: {
      id:          attemptId,
      examId:      examId,
      studentId:   studentId,
      status:      'IN_PROGRESS',
      attemptEndAt: { gt: now },        // attemptEndAt > now  ← deadline guard
    },
    data: {
      status:      'SUBMITTED',
      submittedAt: now,
      endedBy:     'STUDENT',
      // attemptEndAt, remainingSeconds, and StudentAnswers are intentionally
      // NOT touched here, per contract.
    },
  });

  // ── Update succeeded → return success ─────────────────────────────────────
  if (updated.count > 0) {
    return { attemptId, submittedAt: now };
  }

  // ── Update did not match → determine why and throw the correct error ───────
  // Load minimal data to distinguish between: not found / wrong ownership /
  // wrong exam, already SUBMITTED, already EXPIRED, or deadline passed.
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id:           true,
      examId:       true,
      studentId:    true,
      status:       true,
      attemptEndAt: true,
    },
  });

  // 404 conditions: attempt missing, belongs to another exam, or another student
  if (!attempt) {
    throw new NotFoundError('Attempt not found');
  }
  if (attempt.examId !== examId) {
    throw new NotFoundError('Attempt not found');
  }
  if (attempt.studentId !== studentId) {
    throw new NotFoundError('Attempt not found');
  }

  // 409 conditions
  if (attempt.status === 'SUBMITTED') {
    throw new ConflictError('Exam attempt has already been submitted');
  }

  // EXPIRED, or still IN_PROGRESS but deadline has passed
  if (attempt.status === 'EXPIRED') {
    throw new ConflictError('Exam attempt has ended');
  }

  // Catch-all: IN_PROGRESS but now >= attemptEndAt, or any other terminal state
  throw new ConflictError('Exam attempt has ended');
}
