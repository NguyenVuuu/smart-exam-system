import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../../../errors/AppError";
import bcrypt from 'bcrypt'
import { examConfig } from "../../../config";
import type { StartExamResult, ExamContentResult, SubmitExamResult, AttemptStatusResult } from "../types";
import type { SendHeartbeatResult, RunCodeResult, RunCodeTestCase } from '../types'
import { judge0Service, Judge0Service } from '../../../lib/judge0'
import type { Judge0Submission, Judge0SubmissionResult } from '../../../lib/judge0'
import * as repo from "../repositories/student-take-exam.repository";

/**
 * Chạy async function theo lô (batch) để giới hạn số request đồng thời.
 * Ví dụ: 10 test case → 2 lô × 5 cái song song.
 */
async function runInBatches<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = []
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(fn))
    results.push(...batchResults)
  }
  return results
}

export async function startExam(
  scheduleId: string,
  studentId: string,
  ipAddress: string,      
  deviceInfo: string,
  password?: string,
  webcamConfirmed = false,
): Promise<StartExamResult> {
  // ── 1. Exam must exist ────────────────────────────────────────────────────
  const schedule = await repo.findScheduleById(scheduleId);
  if (!schedule) {
    throw new NotFoundError("Exam schedule not found");
  }

  // ── 2. CourseOffering must exist ──────────────────────────────────────────
  const enrollment = await repo.findEnrollment(scheduleId, studentId);
  if (!enrollment) {
    throw new NotFoundError("Not Found");
  }

  // ── 4. Exam must be PUBLISHED ─────────────────────────────────────────────
  if (!['SCHEDULED', 'OPEN'].includes(schedule.status)) {
    throw new ConflictError("Exam schedule is not available");
  }

  // ── 5. Exam must have publishedAt ─────────────────────────────────────────
  if (!schedule.publishedAt) {
    throw new ConflictError("Exam schedule has not been published yet");
  }

  // ── 6. Time window & Active attempt resumption ─────────────────────────────
  const now = new Date();

  if (now < schedule.startTime) {
    throw new ConflictError("Exam has not started yet");
  }

  if (schedule.enableWebcam && !webcamConfirmed) {
    throw new ForbiddenError("Webcam access is required to start this exam");
  }

  // Allow student to resume if active attempt is valid (e.g. granted extra time beyond schedule.endTime)
  const activeAttempt = await repo.findActiveAttempt(scheduleId, studentId);
  if (activeAttempt && activeAttempt.deadlineAt > now) {
    return {
      attemptId: activeAttempt.id,
      startedAt: activeAttempt.startedAt,
      attemptEndAt: activeAttempt.deadlineAt,
      remainingSeconds: Math.floor((activeAttempt.deadlineAt.getTime() - now.getTime()) / 1000),
    };
  }

  if (now >= schedule.endTime) {
    throw new ConflictError("Exam has already ended");
  }

  // ── 7. Attempt limit ──────────────────────────────────────────────────────
  const attemptCount = await repo.countAttemptsForSchedule(scheduleId, studentId);
  if (attemptCount >= schedule.maxAttempts) {
    throw new ConflictError("Maximum attempts reached");
  }

  // ── 8. Password check (before creating attempt) ───────────────────────────
  // Contract: checked after all other validations but before attempt creation.
  // Missing password or wrong password → 403 "Invalid exam password".
  if (schedule.passwordHash !== null) {
    if (!password || !(await bcrypt.compare(password, schedule.passwordHash))) {
      throw new ForbiddenError("Invalid exam password");
    }
  }

  // Use a single timestamp for all calculations so there are no clock skew
  // issues between startedAt, attemptEndAt, and remainingSeconds.
  const startedAt = now;

  const durationEndAt = new Date(
    startedAt.getTime() + schedule.durationMinutes * 60 * 1000,
  );
  const attemptEndAt =
    durationEndAt < schedule.endTime ? durationEndAt : schedule.endTime;

  const remainingSeconds = Math.max(
    0,
    Math.floor((attemptEndAt.getTime() - startedAt.getTime()) / 1000),
  );

  // ── 9. Create attempt (safe against concurrent duplicate requests) ─────────
  let attempt: { id: string; startedAt: Date; deadlineAt: Date };

  // Note: attemptEndAt is stored as authoritative deadline in DB.
  // remainingSeconds is stored as a snapshot for countdown initialization only.
  // Both values are computed from startedAt + exam.durationMinutes, not updated later.
  try {
    attempt = await repo.createAttemptSafe({
      scheduleId,
      examId: schedule.exam.id,
      courseOfferingId: enrollment.courseOfferingId,
      studentId,
      startedAt,
      deadlineAt: attemptEndAt,
      attemptNo: attemptCount + 1,
      shuffleQuestions: ['SHUFFLE_QUESTIONS', 'SHUFFLE_QUESTIONS_AND_OPTIONS', 'RANDOM_SUBSET'].includes(schedule.distributionMode),
      shuffleOptions: ['SHUFFLE_OPTIONS', 'SHUFFLE_QUESTIONS_AND_OPTIONS'].includes(schedule.distributionMode),
      randomQuestionCount: schedule.randomQuestionCount,
      ipAddress,
      deviceInfo,  
    });
  } catch (err) {
    if (err instanceof Error && err.name === "DUPLICATE_ATTEMPT") {
      throw new ConflictError("Maximum attempts reached");
    }

    // Prisma unique constraint violation — concurrent request won the race
    const prismaErr = err as { code?: string };
    if (prismaErr.code === "P2002") {
      throw new ConflictError("Maximum attempts reached");
    }

    throw err;
  }

  return {
    attemptId: attempt.id,
    startedAt: attempt.startedAt,
    attemptEndAt,
    remainingSeconds,
  };
}

// ─── API 2: Get Exam Content ──────────────────────────────────────────────────

export async function getExamContent(
  scheduleId: string,
  attemptId: string,
  studentId: string,
): Promise<ExamContentResult> {
  // ── 1. Load attempt + questions + saved answers (ownership in repo) ───────
  const result = await repo.findAttemptWithContent(
    attemptId,
    scheduleId,
    studentId,
  );
  if (!result) {
    throw new NotFoundError("Attempt not found");
  }

  const { attempt, pointsMap, answerMap } = result;

  // ── 2. Check expiry using attemptEndAt from DB ─────────────────────────────
  const now = new Date();
  if (attempt.status !== 'IN_PROGRESS' || now >= attempt.deadlineAt) {
    throw new ConflictError("Exam attempt has ended");
  }

  // ── 3. Compute remainingSeconds realtime from attemptEndAt ────────────────
  const remainingSeconds = Math.max(
    0,
    Math.floor((attempt.deadlineAt.getTime() - now.getTime()) / 1000),
  );

  // ── 4. Build question list from the attempt snapshot ─────────────────────
  // Source of truth: ExamAttemptQuestion ordered by displayOrder ASC.
  // Choice questions carry options + answer (selectedOptionIds for state restore).
  // Programming questions carry draftSourceCode (for state restore); no options field.
  const questions: ExamContentResult["questions"] = attempt.attemptQuestions.map((aq) => {
    const q       = aq.examQuestion
    const qId     = q.id
    const points  = pointsMap.get(qId) ?? 0
    const savedAnswer = answerMap.get(qId)

    if (q.type === 'PROGRAMMING') {
      return {
        id:              qId,
        orderIndex:      aq.displayOrder,
        content:         q.content,
        type:            'PROGRAMMING' as const,
        points,
        draftSourceCode: savedAnswer?.draftSourceCode ?? null,
        language: q.language ?? 'UNKNOWN',   // ← fallback nếu null
      }
    }

    // Order options according to shuffledOptionIds (API 2 requirement)
    const orderedOptions = aq.shuffledOptionIds?.length > 0
      ? aq.shuffledOptionIds.map(id => q.options.find(o => o.id === id)).filter((o): o is { id: string; content: string } => o !== undefined)
      : q.options;

    return {
      id:         qId,
      orderIndex: aq.displayOrder,
      content:    q.content,
      type:       q.type as 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE',
      points,
      options:    orderedOptions.map(opt => ({ id: opt.id, content: opt.content })),
      answer:     savedAnswer?.selectedOptionIds ?? [],
    }
  })

  return {
    attemptId:       attempt.id,
    title:           attempt.examSchedule.title,
    durationMinutes: attempt.examSchedule.durationMinutes,
    remainingSeconds,
    attemptEndAt:    attempt.deadlineAt,
    integritySettings: {
      enableWebcam: attempt.examSchedule.enableWebcam,
      blockCopyPaste: attempt.examSchedule.blockCopyPaste,
      blockRightClick: attempt.examSchedule.blockRightClick,
    },
    questions,
  };
}

// ─── API 3: Save Answer ───────────────────────────────────────────────────────

export async function saveAnswer(
  scheduleId: string,
  attemptId: string,
  studentId: string,
  questionId: string,
  answer: string | string[],
): Promise<{ questionId: string; remainingSeconds: number }> {
  // ── 1. Load attempt with exam and attempt questions ───────────────────────
  const attempt = await repo.findAttemptForAnswer(attemptId, scheduleId, studentId, questionId)

  // Validate attempt exists and belongs to student and exam
  if (!attempt) {
    throw new NotFoundError("Attempt not found");
  }
  // ── 2. Check attempt status ───────────────────────────────────────────────
  if (attempt.status !== "IN_PROGRESS") {
    throw new ConflictError("Exam attempt has ended");
  }

  // ── 3. Check attemptEndAt ──────────────────────────────────────────────────
  const now = new Date();
  if (now >= attempt.deadlineAt) {
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
  await repo.saveAnswer(attemptId, questionId, selectedOptionIds, draftSourceCode, now)

  // ── 8. Calculate remainingSeconds (realtime) ──────────────────────────────
  const remainingSeconds = Math.max(
    0,
    Math.floor((attempt.deadlineAt.getTime() - now.getTime()) / 1000),
  );

  return {
    questionId,
    remainingSeconds,
  };
}

// ─── API 4: Submit Exam ───────────────────────────────────────────────────────

export async function submitExam(
  scheduleId: string,
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

  const updated = await repo.submitAttempt(attemptId, scheduleId, studentId, now)

  // ── Update succeeded → return success ─────────────────────────────────────
  if (updated.count > 0) {
    // Trigger background grading (do not await — fire-and-forget)
    // TODO: Implement gradingService.gradeExamAttempt(attemptId)
    // For now, this ensures the contract is followed.
    return { attemptId, submittedAt: now };
  }

  // ── Update did not match → determine why and throw the correct error ───────
  // Load minimal data to distinguish between: not found / wrong ownership /
  // wrong exam, already SUBMITTED, already EXPIRED, or deadline passed.
  const attempt = await repo.findAttemptIdentity(attemptId)

  // 404 conditions: attempt missing, belongs to another exam, or another student
  if (!attempt) {
    throw new NotFoundError('Attempt not found');
  }
  if (attempt.examScheduleId !== scheduleId) {
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
  if (attempt.status === 'AUTO_SUBMITTED' || attempt.status === 'INVALIDATED') {
    throw new ConflictError('Exam attempt has ended');
  }

  // Catch-all: IN_PROGRESS but now >= attemptEndAt, or any other terminal state
  throw new ConflictError('Exam attempt has ended');
}

// ─── API 5: Get Attempt Status ────────────────────────────────────────────────

export async function getAttemptStatus(
  scheduleId: string,
  attemptId: string,
  studentId: string,
): Promise<AttemptStatusResult> {
  // ── 1. Load attempt with session + counts (ownership validated in repo) ───
  const data = await repo.findAttemptStatus(attemptId, scheduleId, studentId)
  if (!data) {
    throw new NotFoundError('Attempt not found')
  }

  // ── 2. Compute remainingSeconds realtime from attemptEndAt ────────────────
  // Contract: IN_PROGRESS → realtime calc; SUBMITTED / EXPIRED → 0
  const now = new Date()

  const remainingSeconds =
    data.status === 'IN_PROGRESS'
      ? Math.max(0, Math.floor((data.deadlineAt.getTime() - now.getTime()) / 1000))
      : 0

  // ── 3. Compute isOnline from lastHeartbeat (NOT from ExamSession.isOnline) ─
  // ExamSession.isOnline is intentionally ignored per contract section 9.
  const isOnline: boolean = data.examSession !== null
    && (now.getTime() - data.examSession.lastHeartbeat.getTime()) <= examConfig.heartbeatTimeoutMs

  return {
    attemptId:          data.id,
    status:             data.status,
    startedAt:          data.startedAt,
    attemptEndAt:       data.deadlineAt,
    submittedAt:        data.submittedAt,
    endedBy:            data.endedBy,
    remainingSeconds,
    lastSavedAt:        data.lastSavedAt,
    isOnline,
    answeredCount:      data._count.studentAnswers,
    totalQuestionCount: data._count.attemptQuestions,
  }
}

// ─── API 6: Send Heartbeat ───────────────────────────────────────────────────

export async function sendHeartbeat(
  scheduleId: string,
  attemptId: string,
  studentId: string,
): Promise<SendHeartbeatResult> {
  const now = new Date()

  // ── 1. Load attempt and validate ownership ─────────────────────────────────
  const attemptData = await repo.findAttemptForHeartbeat(attemptId, scheduleId, studentId)
  if (!attemptData) {
    throw new NotFoundError("Attempt not found")
  }

  // ── 2. Check attempt status ────────────────────────────────────────────────
  if (attemptData.status !== "IN_PROGRESS") {
    if (attemptData.status === "SUBMITTED") {
      throw new ConflictError("Exam attempt has already been submitted")
    }
    throw new ConflictError("Exam attempt has ended") // EXPIRED or other terminal state
  }

  // ── 3. Check deadline (attemptEndAt) ───────────────────────────────────────
  if (now >= attemptData.deadlineAt) {
    throw new ConflictError("Exam attempt has ended")
  }

  // ── 4. Update ExamSession.lastHeartbeat atomically ─────────────────────────
  await repo.upsertExamSessionHeartbeat(attemptId, now)

  // ── 5. Compute remainingSeconds realtime ───────────────────────────────────
  const remainingSeconds = Math.max(
    0,
    Math.floor((attemptData.deadlineAt.getTime() - now.getTime()) / 1000),
  )

  // ── 6. Return result with isOnline = true (student just sent heartbeat) ─────
  return {
    remainingSeconds,
    isOnline: true,
  }
}

// ─── API 7: Run Code ─────────────────────────────────────────────────────────


export async function runCode(
  scheduleId: string,
  attemptId: string,
  questionId: string,
  studentId: string,
  sourceCode: string,
): Promise<RunCodeResult> {
  const now = new Date()

  // ── 1. Load attempt and question data (with test cases) ───────────────────
  const data = await repo.findProgrammingQuestionWithTestCases(
    questionId,
    attemptId,
    scheduleId,
    studentId,
  )
  if (!data) {
    throw new NotFoundError("Attempt not found")
  }

  const { attempt, question } = data

  if (!question) {
    throw new NotFoundError("Question not found in this attempt")
  }

  // ── 2. Validate attempt status and deadline ────────────────────────────────
  if (attempt.status !== "IN_PROGRESS") {
    if (attempt.status === "SUBMITTED") {
      throw new ConflictError("Exam attempt has already been submitted")
    }
    throw new ConflictError("Exam attempt has ended")
  }

  if (now >= attempt.attemptEndAt) {
    throw new ConflictError("Exam attempt has ended")
  }

  // ── 3. Validate question type ──────────────────────────────────────────────
  if (question.type !== "PROGRAMMING") {
    throw new ValidationError("Question is not a programming question")
  }

  // ── 4. Validate source code size ───────────────────────────────────────────
  const maxCodeSizeKb = question.programmingQuestionConfig?.maxCodeSizeKb ?? 64 // default 64KB
  const maxCodeSizeBytes = maxCodeSizeKb * 1024
  // Calculate UTF-8 byte length without Buffer
  const encoder = new TextEncoder()
  const byteLength = encoder.encode(sourceCode).length
  if (byteLength > maxCodeSizeBytes) {
    throw new ValidationError("Source code exceeds maximum allowed size")
  }

  // ── 5. Save draftSourceCode to StudentAnswer (atomic upsert) ───────────────
  await repo.upsertStudentAnswerForProgramming(attemptId, questionId, sourceCode)

  // ── 6. Update ExamAttempt.lastSavedAt ──────────────────────────────────────
  await repo.updateAttemptLastSavedAt(attemptId, now)

  // ── 7. Prepare test cases ──────────────────────────────────────────────────
  const testCases = question.programmingTestCases
  if (testCases.length === 0) {
    // If no test cases, return empty results
    const remainingSeconds = Math.max(
      0,
      Math.floor((attempt.attemptEndAt.getTime() - now.getTime()) / 1000),
    )
    const isOnline = attempt.examSession !== null &&
      (now.getTime() - attempt.examSession.lastHeartbeat.getTime()) <= examConfig.heartbeatTimeoutMs

    return {
      questionId,
      remainingSeconds,
      isOnline,
      compilationStatus: "COMPILED" as const,
      compilerOutput: null,
      runtimeError: null,
      hasSystemError: false,
      summary: {
        passedCount: 0,
        totalCount: 0,
        message: "Không có test case nào để kiểm tra",
      },
      testCases: [],
    }
  }

  // ── 8. Prepare Judge0 submissions ──────────────────────────────────────────
  const timeLimitMs = question.programmingQuestionConfig?.timeLimitMs ?? 2000 // default 2s
  const memoryLimitKb = question.programmingQuestionConfig?.memoryLimitKb ?? 256 * 1024 // default 256MB

  // Pass expected_output for ALL test cases (sample + hidden) to avoid false passes on hidden
  const submissions: Judge0Submission[] = testCases.map(testCase => ({
    source_code: sourceCode,
    language_id: question.language, // "JAVA", "C", "CPP"
    stdin: testCase.input,
    expected_output: testCase.expectedOutput, // Always pass expected_output
    cpu_time_limit: timeLimitMs / 1000, // Convert ms to seconds
    memory_limit: memoryLimitKb,
  }))

    // ── 9. Execute submissions via Judge0 ──────────────────────────────────────
  // Chạy theo lô 5 test case song song để tránh quá tải Judge0.
  // Nếu 1 test case lỗi hạ tầng, trả placeholder SYSTEM_ERROR để lô còn lại vẫn chạy.
  const BATCH_SIZE = 5

  const judge0Results = await runInBatches(
    submissions,
    BATCH_SIZE,
    async (submission) => {
      try {
        return await judge0Service.submitSingle(submission)
      } catch (error) {
        return {
          stdout: null,
          stderr: null,
          compile_output: "System error during code execution",
          message: error instanceof Error ? error.message : "Unknown error",
          status: { id: 13, description: "System Error" },
          time: null,
          memory: null,
        }
      }
    },
  )

  // ── 10. Process Judge0 results ────────────────────────────────────────────
  let compilationStatus: 'COMPILED' | 'COMPILE_ERROR' = 'COMPILED'
  let compilerOutput: string | null = null
  let runtimeError: string | null = null
  let passedCount = 0

  const processedTestCases: RunCodeTestCase[] = []

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i]
    const judge0Result = judge0Results[i]
    
    // Check for compilation error (if any test case fails compilation, all fail)
    if (judge0Result.status.id === 6) { // Compilation Error
      compilationStatus = "COMPILE_ERROR"
      compilerOutput = judge0Result.compile_output || judge0Result.stderr || "Compilation failed"
      // Stop processing test cases
      break
    }

    // Map Judge0 status to our internal status
    const status = Judge0Service.mapStatusToInternal(judge0Result.status.id)

    // Check if passed (only for COMPILED submissions)
    const isPassed = status === 'PASSED'
    if (isPassed) {
      passedCount++
    }

    // Track first runtime error in sample test cases
    if (testCase.isSample && 
        (status === 'RUNTIME_ERROR' || status === 'TIME_LIMIT_EXCEEDED' || status === 'MEMORY_LIMIT_EXCEEDED') &&
        runtimeError === null) {
      runtimeError = judge0Result.stderr || judge0Result.message || "Runtime error occurred"
    }

    // Build test case result
    if (testCase.isSample) {
      processedTestCases.push({
        testCaseId: testCase.id,
        isSample: true,
        status,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: judge0Result.stdout,
        executionTimeMs: parseFloat(judge0Result.time || '0') * 1000, // Convert seconds to ms
        memoryUsedKb: judge0Result.memory || 0,
      })
    } else {
      processedTestCases.push({
        testCaseId: testCase.id,
        isSample: false,
        status,
      })
    }
  }
  // ← THÊM DÒNG NÀY sau vòng lặp for
  // hasSystemError = true nếu có ít nhất 1 test case bị lỗi hạ tầng (status.id === 13)
  // và KHÔNG phải do lỗi biên dịch (compile error là lỗi code, không phải hạ tầng)
  const hasSystemError =
    compilationStatus !== 'COMPILE_ERROR' &&
    judge0Results.some((r) => r.status.id === 13)

  // ── 11. Compute remainingSeconds and isOnline ──────────────────────────────
  const remainingSeconds = Math.max(
    0,
    Math.floor((attempt.attemptEndAt.getTime() - now.getTime()) / 1000),
  )
  
  const isOnline = attempt.examSession !== null &&
    (now.getTime() - attempt.examSession.lastHeartbeat.getTime()) <= examConfig.heartbeatTimeoutMs

  // ── 12. Build summary message ──────────────────────────────────────────────
  const totalCount = testCases.length
  let message: string
  
  if (compilationStatus === "COMPILE_ERROR") {
    message = "Biên dịch thất bại"
  } else if (totalCount === 0) {
    message = "Không có test case nào để kiểm tra"
  } else {
    message = `Bạn đã pass ${passedCount}/${totalCount} test cases`
  }

  // ── 13. Return result ─────────────────────────────────────────────────────
  return {
    questionId,
    remainingSeconds,
    isOnline,
    compilationStatus,
    compilerOutput,
    runtimeError,
    hasSystemError, 
    summary: {
      passedCount: compilationStatus === "COMPILE_ERROR" ? 0 : passedCount,
      totalCount: compilationStatus === "COMPILE_ERROR" ? 0 : totalCount,
      message,
    },
    testCases: processedTestCases,
  }
}
