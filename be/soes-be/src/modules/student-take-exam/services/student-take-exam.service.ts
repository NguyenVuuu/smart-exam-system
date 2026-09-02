import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../../../errors/AppError";
import bcrypt from 'bcrypt'
import type { SeverityLevel, ViolationType } from '@prisma/client'
import { examConfig } from "../../../config";
import type { StartExamResult, ExamContentResult, SubmitExamResult, AttemptStatusResult, AttemptResult, RecordViolationResult } from "../types";
import type { SendHeartbeatResult, RunCodeResult, RunCodeTestCase } from '../types'
import { judge0Service, Judge0Service } from '../../../lib/judge0'
import type { Judge0Submission, Judge0SubmissionResult } from '../../../lib/judge0'
import * as repo from "../repositories/student-take-exam.repository";
import { gradeObjectiveAnswers } from '../repositories/attempt-grading.repository'
import { gradeProgrammingAnswers } from './programming-grading.service'
import { isResultReleased } from '../../exam-schedules/utils/result-release'

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

const JUDGE0_RUN_BATCH_SIZE = 5

type RunCodeAttempt = {
  attemptEndAt: Date
  examSession: { lastHeartbeat: Date } | null
}

type RunCodeTest = {
  id: string
  input: string
  expectedOutput: string
  isSample: boolean
}

function remainingSecondsUntil(endAt: Date, now: Date) {
  return Math.max(0, Math.floor((endAt.getTime() - now.getTime()) / 1000))
}

function isAttemptOnline(attempt: RunCodeAttempt, now: Date) {
  return attempt.examSession !== null &&
    (now.getTime() - attempt.examSession.lastHeartbeat.getTime()) <= examConfig.heartbeatTimeoutMs
}

function systemErrorResult(error: unknown): Judge0SubmissionResult {
  return {
    stdout: null,
    stderr: null,
    compile_output: 'System error during code execution',
    message: error instanceof Error ? error.message : 'Unknown error',
    status: { id: 13, description: 'System Error' },
    time: null,
    memory: null,
  }
}

function buildRunCodeSubmissions(
  sourceCode: string,
  language: string,
  tests: RunCodeTest[],
  config: { timeLimitMs?: number; memoryLimitKb?: number } | null,
): Judge0Submission[] {
  const timeLimitMs = config?.timeLimitMs ?? 2000
  const memoryLimitKb = config?.memoryLimitKb ?? 256 * 1024

  return tests.map((test) => ({
    source_code: sourceCode,
    language_id: language,
    stdin: test.input,
    expected_output: test.expectedOutput,
    cpu_time_limit: timeLimitMs / 1000,
    memory_limit: memoryLimitKb,
  }))
}

async function runJudge0Submissions(submissions: Judge0Submission[]) {
  return runInBatches(
    submissions,
    JUDGE0_RUN_BATCH_SIZE,
    async (submission) => {
      try {
        return await judge0Service.submitAndPoll(submission)
      } catch (error) {
        return systemErrorResult(error)
      }
    },
  )
}

function buildEmptyRunCodeResult(
  questionId: string,
  attempt: RunCodeAttempt,
  now: Date,
): RunCodeResult {
  return {
    questionId,
    remainingSeconds: remainingSecondsUntil(attempt.attemptEndAt, now),
    isOnline: isAttemptOnline(attempt, now),
    compilationStatus: 'COMPILED',
    compilerOutput: null,
    runtimeError: null,
    hasSystemError: false,
    summary: {
      passedCount: 0,
      totalCount: 0,
      message: 'Không có test case nào để kiểm tra',
    },
    testCases: [],
  }
}

function buildRunCodeResult(
  questionId: string,
  attempt: RunCodeAttempt,
  tests: RunCodeTest[],
  judge0Results: Judge0SubmissionResult[],
  now: Date,
): RunCodeResult {
  let compilationStatus: RunCodeResult['compilationStatus'] = 'COMPILED'
  let compilerOutput: string | null = null
  let runtimeError: string | null = null
  let passedCount = 0
  const testCases: RunCodeTestCase[] = []

  for (const [index, test] of tests.entries()) {
    const result = judge0Results[index]
    if (result.status.id === 6) {
      compilationStatus = 'COMPILE_ERROR'
      compilerOutput = result.compile_output || result.stderr || 'Compilation failed'
      break
    }

    const status = Judge0Service.mapStatusToInternal(result.status.id)
    if (status === 'PASSED') passedCount++
    if (!runtimeError && test.isSample && ['RUNTIME_ERROR', 'TIME_LIMIT_EXCEEDED', 'MEMORY_LIMIT_EXCEEDED'].includes(status)) {
      runtimeError = result.stderr || result.message || 'Runtime error occurred'
    }

    testCases.push({
      testCaseId: test.id,
      isSample: true,
      status,
      input: test.input,
      expectedOutput: test.expectedOutput,
      actualOutput: result.stdout,
      executionTimeMs: parseFloat(result.time || '0') * 1000,
      memoryUsedKb: result.memory || 0,
    })
  }

  const hasSystemError =
    compilationStatus !== 'COMPILE_ERROR' &&
    judge0Results.some((result) => result.status.id === 13)
  const totalCount = compilationStatus === 'COMPILE_ERROR' ? 0 : tests.length

  return {
    questionId,
    remainingSeconds: remainingSecondsUntil(attempt.attemptEndAt, now),
    isOnline: isAttemptOnline(attempt, now),
    compilationStatus,
    compilerOutput,
    runtimeError,
    hasSystemError,
    summary: {
      passedCount: compilationStatus === 'COMPILE_ERROR' ? 0 : passedCount,
      totalCount,
      message: compilationStatus === 'COMPILE_ERROR'
        ? 'Biên dịch thất bại'
        : `Bạn đã pass ${passedCount}/${tests.length} test cases`,
    },
    testCases,
  }
}

export async function startExam(
  scheduleId: string,
  studentId: string,
  actorUserId: string,
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
      actorUserId,
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
        language: q.language ?? 'JAVA',
        programmingConfig: {
          timeLimitMs: q.programmingConfig?.timeLimitMs ?? 2000,
          memoryLimitMb: Math.round((q.programmingConfig?.memoryLimitKb ?? 262144) / 1024),
          maxCodeSizeKb: q.programmingConfig?.maxCodeSizeKb ?? 256,
        },
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
    await gradeProgrammingAnswers(attemptId)
    await gradeObjectiveAnswers(attemptId)
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

export async function getAttemptResult(
  scheduleId: string,
  attemptId: string,
  studentId: string,
): Promise<AttemptResult> {
  const attempt = await repo.findAttemptResult(attemptId, scheduleId, studentId)
  if (!attempt) throw new NotFoundError('Attempt not found')

  const schedule = attempt.examSchedule
  const released = isResultReleased(schedule)
  const graded = attempt.totalScore !== null
  const available = released && graded
  const maxScore = attempt.attemptQuestions.reduce(
    (total, question) => total + Number(question.examQuestion.points),
    0,
  )

  const reason = schedule.resultReleaseMode === 'NEVER'
    ? 'NEVER'
    : !released
      ? 'PENDING_RELEASE'
      : !graded
        ? 'GRADING'
        : 'AVAILABLE'

  return {
    available,
    releaseMode: schedule.resultReleaseMode,
    releaseAt: schedule.resultReleaseAt,
    score: available ? Number(attempt.totalScore) : null,
    maxScore: available ? maxScore : null,
    reviewPolicy: available ? schedule.reviewPolicy : null,
    reason,
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


export async function recordViolation(
  scheduleId: string,
  attemptId: string,
  studentId: string,
  input: {
    violationType: string
    severity: string
    description?: string
    detectedAt?: string
  },
): Promise<RecordViolationResult> {
  const attempt = await repo.findAttemptForViolation(attemptId, scheduleId, studentId)
  if (!attempt) {
    throw new NotFoundError('Attempt not found')
  }

  const now = new Date()
  if (attempt.status !== 'IN_PROGRESS' || now >= attempt.deadlineAt) {
    throw new ConflictError('Exam attempt has ended')
  }

  const detectedAt = input.detectedAt ? new Date(input.detectedAt) : now
  if (Number.isNaN(detectedAt.getTime())) {
    throw new ValidationError('Invalid detectedAt')
  }

  return repo.createViolation({
    attemptId,
    violationType: input.violationType as ViolationType,
    severity: input.severity as SeverityLevel,
    description: input.description,
    detectedAt,
  })
}

export async function runCode(
  scheduleId: string,
  attemptId: string,
  questionId: string,
  studentId: string,
  sourceCode: string,
): Promise<RunCodeResult> {
  const now = new Date()

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

  if (!question) throw new NotFoundError("Question not found in this attempt")

  if (attempt.status !== "IN_PROGRESS") {
    if (attempt.status === "SUBMITTED") {
      throw new ConflictError("Exam attempt has already been submitted")
    }
    throw new ConflictError("Exam attempt has ended")
  }

  if (now >= attempt.attemptEndAt) {
    throw new ConflictError("Exam attempt has ended")
  }

  if (question.type !== "PROGRAMMING") {
    throw new ValidationError("Question is not a programming question")
  }
  if (!['JAVA', 'C', 'CPP'].includes(question.language)) {
    throw new ValidationError("Unsupported programming language")
  }

  const maxCodeSizeKb = question.programmingQuestionConfig?.maxCodeSizeKb ?? 64
  if (Buffer.byteLength(sourceCode, 'utf8') > maxCodeSizeKb * 1024) {
    throw new ValidationError("Source code exceeds maximum allowed size")
  }

  await repo.upsertStudentAnswerForProgramming(attemptId, questionId, sourceCode)
  await repo.updateAttemptLastSavedAt(attemptId, now)

  const testCases = question.programmingTestCases
  if (testCases.length === 0) {
    return buildEmptyRunCodeResult(questionId, attempt, now)
  }

  const submissions = buildRunCodeSubmissions(
    sourceCode,
    question.language,
    testCases,
    question.programmingQuestionConfig,
  )
  const judge0Results = await runJudge0Submissions(submissions)
  return buildRunCodeResult(questionId, attempt, testCases, judge0Results, now)
}
