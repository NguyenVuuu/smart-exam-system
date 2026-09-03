import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../../errors/AppError";
import { randomInt, randomUUID } from "crypto";
import { toPagination } from "../../../utils/pagination";
import {
  toTeacherExamDetailDto,
  toTeacherExamDto,
} from "../mappers/teacher-exam.mapper";
import * as repo from "../repositories/teacher-exams.repository";
import * as lifecycleRepo from "../repositories/teacher-exam-lifecycle.repository";
import type {
  AutoGenerateExamBody,
  ExamApprovalQuery,
  ExamBody,
  ExamQuestionInput,
  ExamsQuery,
} from "../validators/teacher-exams.validator";
import type { SnapshotSource } from "../repositories/exam-question-snapshot.repository";

type InlineExamQuestion = Extract<ExamQuestionInput, { source: 'INLINE' }>['question'];
type AutoQuestionPoolItem = Awaited<ReturnType<typeof repo.findAutoExamQuestionPool>>[number];

const difficultyKeys = ['easy', 'medium', 'hard'] as const;
const difficultyByKey = { easy: 'EASY', medium: 'MEDIUM', hard: 'HARD' } as const;
const isProgrammingQuestion = (question: AutoQuestionPoolItem) => question.type === 'PROGRAMMING';
const isObjectiveQuestion = (question: AutoQuestionPoolItem) => question.type !== 'PROGRAMMING';

function shuffle<T>(items: T[]) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function splitPoints(totalPoints: number, count: number) {
  if (count <= 0) return [];
  const base = Math.floor((totalPoints / count) * 100) / 100;
  const points = Array.from({ length: count }, () => base);
  const used = base * count;
  points[count - 1] = Number((points[count - 1] + totalPoints - used).toFixed(2));
  return points;
}

function toQuestionSnapshot(question: AutoQuestionPoolItem): SnapshotSource {
  return {
    id: question.id,
    title: question.title,
    content: question.content,
    explanation: question.explanation ?? null,
    type: question.type,
    difficulty: question.difficulty,
    language: question.language ?? null,
    options: question.options.map((option, index) => ({
      content: option.content,
      isCorrect: option.isCorrect,
      orderIndex: index + 1,
    })),
    programmingConfig: question.programmingConfig
      ? {
          timeLimitMs: question.programmingConfig.timeLimitMs,
          memoryLimitKb: question.programmingConfig.memoryLimitKb,
          maxCodeSizeKb: question.programmingConfig.maxCodeSizeKb,
        }
      : null,
    programmingTests: question.programmingTests.map((test) => ({
      input: test.input,
      expectedOutput: test.expectedOutput,
      isSample: test.isSample,
      isHidden: test.isHidden,
    })),
  };
}

function pickAutoQuestions(pool: AutoQuestionPoolItem[], matrix: AutoGenerateExamBody['matrix']) {
  return difficultyKeys.flatMap((key) => {
    const difficulty = difficultyByKey[key];
    const requested = matrix[key];
    const candidates = pool.filter((question) => question.difficulty === difficulty);
    if (candidates.length < requested) {
      throw new ValidationError(`Not enough ${difficulty.toLowerCase()} questions for the requested matrix`);
    }
    return shuffle(candidates).slice(0, requested);
  });
}

function pickManualQuestions(pool: AutoQuestionPoolItem[], ids: string[]) {
  const byId = new Map(pool.map((question) => [question.id, question]));
  const selected = ids.map((id) => byId.get(id)).filter((question): question is AutoQuestionPoolItem => Boolean(question));
  if (selected.length !== ids.length) {
    throw new ValidationError('One or more selected questions are unavailable');
  }
  return selected;
}

function assertMixedQuestions(questions: AutoQuestionPoolItem[]) {
  if (questions.length < 2 || !questions.some(isObjectiveQuestion) || !questions.some(isProgrammingQuestion)) {
    throw new ValidationError('Mixed exams require at least one objective question and one programming question');
  }
}

function balanceMixedAutoQuestions(
  picked: AutoQuestionPoolItem[],
  pool: AutoQuestionPoolItem[],
) {
  assertMixedQuestions(pool);
  if (picked.length < 2) {
    throw new ValidationError('Mixed exams require at least two questions');
  }
  if (picked.some(isObjectiveQuestion) && picked.some(isProgrammingQuestion)) return picked;

  const selectedIds = new Set(picked.map(({ id }) => id));
  const needsProgramming = !picked.some(isProgrammingQuestion);
  const replacementPredicate = needsProgramming ? isProgrammingQuestion : isObjectiveQuestion;
  const replaceablePredicate = needsProgramming ? isObjectiveQuestion : isProgrammingQuestion;

  for (const current of shuffle(picked.filter(replaceablePredicate))) {
    const replacement = shuffle(pool).find((candidate) =>
      replacementPredicate(candidate)
      && candidate.difficulty === current.difficulty
      && !selectedIds.has(candidate.id),
    );
    if (replacement) {
      return picked.map((question) => question.id === current.id ? replacement : question);
    }
  }

  throw new ValidationError('Mixed exams need both objective and programming questions within the requested difficulty matrix');
}

function applyExamFormatRules(
  picked: AutoQuestionPoolItem[],
  pool: AutoQuestionPoolItem[],
  input: Pick<AutoGenerateExamBody, 'format' | 'pickMode'>,
) {
  if (input.format !== 'MIXED') return picked;
  if (input.pickMode === 'MANUAL') {
    assertMixedQuestions(picked);
    return picked;
  }
  return balanceMixedAutoQuestions(picked, pool);
}

function toInlineSnapshot(question: InlineExamQuestion, index: number): SnapshotSource {
  return {
    id: `inline-${index + 1}`,
    title: question.title,
    content: question.content,
    explanation: question.explanation ?? null,
    type: question.type,
    difficulty: question.difficulty,
    language: question.language ?? null,
    options: question.options.map((option, optionIndex) => ({
      ...option,
      orderIndex: optionIndex + 1,
    })),
    programmingConfig: question.programmingConfig
      ? {
          timeLimitMs: question.programmingConfig.timeLimitMs,
          memoryLimitKb: question.programmingConfig.memoryLimitMb * 1024,
          maxCodeSizeKb: question.programmingConfig.maxCodeSizeKb,
        }
      : null,
    programmingTests: question.testCases.map((testCase) => ({
      ...testCase,
      isSample: !testCase.isHidden,
    })),
  };
}

async function teacherContext(teacherId: string) {
  const teacher = await repo.findTeacherContext(teacherId);
  if (!teacher?.departmentId)
    throw new ForbiddenError("Teacher department is required");
  return teacher;
}

async function requireOwnedDraft(teacherId: string, examId: string) {
  const exam = await repo.findExam(examId);
  if (!exam || exam.createdById !== teacherId)
    throw new NotFoundError("Exam not found");
  if (exam.status !== "DRAFT" || exam.approvalStatus === "PENDING")
    throw new ConflictError("Exam is locked for editing");
  return exam;
}

export async function list(teacherId: string, query: ExamsQuery) {
  const [total, rows] = await repo.listOwnedExams(teacherId, query);
  return {
    items: rows.map((row) => toTeacherExamDto(row, teacherId)),
    pagination: toPagination(query.page, query.pageSize, total),
  };
}

export async function get(teacherId: string, examId: string) {
  const exam = await repo.findExamDetail(examId);
  const hasCourseAccess = exam && exam.createdById !== teacherId
    ? await repo.hasClosedCourseExamAccess(teacherId, examId)
    : 0;
  if (!exam || (exam.createdById !== teacherId && !hasCourseAccess))
    throw new NotFoundError("Exam not found");
  return toTeacherExamDetailDto(exam, teacherId);
}

async function validateSubject(teacherId: string, subjectId: string) {
  const teacher = await teacherContext(teacherId);
  const subject = await repo.findSubjectInDepartment(
    subjectId,
    teacher.departmentId!,
  );
  if (!subject)
    throw new ForbiddenError("Subject is outside teacher department");
}

async function validateSemester(semesterId: string) {
  if (!await repo.findAvailableSemester(semesterId)) {
    throw new ValidationError('Exam semester must be upcoming or active')
  }
}

export async function create(teacherId: string, data: ExamBody) {
  await Promise.all([validateSubject(teacherId, data.subjectId), validateSemester(data.semesterId)]);
  return toTeacherExamDto(await repo.createExam(teacherId, data), teacherId);
}

export async function autoGenerate(teacherId: string, data: AutoGenerateExamBody) {
  await Promise.all([validateSubject(teacherId, data.subjectId), validateSemester(data.semesterId)]);

  const pool = await repo.findAutoExamQuestionPool(teacherId, data);
  const initialPicked = data.pickMode === 'AUTO'
    ? shuffle(pickAutoQuestions(pool, data.matrix))
    : pickManualQuestions(pool, data.selectedQuestionIds);
  const picked = applyExamFormatRules(initialPicked, pool, data);

  if (!picked.length) throw new ValidationError('No questions were selected for this exam');

  const sectionIds = { OBJECTIVE: randomUUID(), PROGRAMMING: randomUUID() };
  const points = splitPoints(data.totalPoints, picked.length);
  const questions = picked.map((question, index) => ({
    question: toQuestionSnapshot(question),
    sourceQuestionId: question.id,
    points: points[index],
    sectionId: question.type === 'PROGRAMMING' ? sectionIds.PROGRAMMING : sectionIds.OBJECTIVE,
    orderIndex: index + 1,
  }));

  const objectivePoints = questions
    .filter(({ sectionId }) => sectionId === sectionIds.OBJECTIVE)
    .reduce((sum, question) => sum + question.points, 0);
  const programmingPoints = questions
    .filter(({ sectionId }) => sectionId === sectionIds.PROGRAMMING)
    .reduce((sum, question) => sum + question.points, 0);
  const sections = [
    ...(objectivePoints > 0 ? [{
      id: sectionIds.OBJECTIVE,
      title: 'Phần 1: Trắc nghiệm',
      description: 'Câu hỏi được chọn tự động từ ngân hàng câu hỏi.',
      type: 'OBJECTIVE' as const,
      targetPoints: Number(objectivePoints.toFixed(2)),
      orderIndex: 1,
    }] : []),
    ...(programmingPoints > 0 ? [{
      id: sectionIds.PROGRAMMING,
      title: objectivePoints > 0 ? 'Phần 2: Lập trình' : 'Phần 1: Lập trình',
      description: 'Bài lập trình được chọn tự động từ ngân hàng câu hỏi.',
      type: 'PROGRAMMING' as const,
      targetPoints: Number(programmingPoints.toFixed(2)),
      orderIndex: objectivePoints > 0 ? 2 : 1,
    }] : []),
  ];

  const exam = await repo.createAutoGeneratedExam(teacherId, data, sections, questions);
  return toTeacherExamDetailDto(exam, teacherId);
}

export async function update(
  teacherId: string,
  examId: string,
  data: ExamBody,
) {
  const exam = await requireOwnedDraft(teacherId, examId);
  await Promise.all([validateSubject(teacherId, data.subjectId), validateSemester(data.semesterId)]);
  const existingIds = new Set(exam.sections.map(({ id }) => id));
  const newIds = data.sections
    .filter(({ id }) => !existingIds.has(id))
    .map(({ id }) => id);
  if (newIds.length && (await repo.countExistingSections(newIds))) {
    throw new ValidationError(
      "One or more exam sections belong to another exam",
    );
  }
  const removedWithQuestions = exam.sections.some(
    ({ id, _count }) =>
      !data.sections.some((section) => section.id === id) &&
      _count.questions > 0,
  );
  if (removedWithQuestions)
    throw new ConflictError(
      "Move or remove questions before deleting their section",
    );

  const updated = await repo.updateExam(
    examId,
    teacherId,
    exam.updatedAt,
    existingIds,
    data,
  );
  if (!updated)
    throw new ConflictError(
      "Exam was changed in another session; reload and try again",
    );
  return toTeacherExamDto(updated, teacherId);
}

export async function replaceQuestions(
  teacherId: string,
  examId: string,
  items: ExamQuestionInput[],
) {
  const exam = await requireOwnedDraft(teacherId, examId);
  const bankItems = items.filter((item) => item.source === 'QUESTION_BANK');
  const uniqueIds = [...new Set(bankItems.map(({ questionId }) => questionId))];
  if (uniqueIds.length !== bankItems.length)
    throw new ValidationError("Exam questions must be unique");
  const questions = await repo.findAvailableQuestions(
    teacherId,
    exam.subjectId,
    uniqueIds,
  );
  if (questions.length !== bankItems.length)
    throw new ValidationError("One or more questions are unavailable");
  const total = items.reduce((sum, item) => sum + item.points, 0);
  if (Math.abs(total - Number(exam.totalPoints)) > 0.001)
    throw new ValidationError("Question points must equal exam total points");
  const byId = new Map(questions.map((question) => [question.id, question]));
  const sectionIds = new Set(exam.sections?.map(({ id }) => id) ?? []);
  if (items.some(({ sectionId }) => sectionId && !sectionIds.has(sectionId))) {
    throw new ValidationError("One or more exam sections are invalid");
  }
  const rows = items.map((item, index) => {
    if (item.source === 'QUESTION_BANK') {
      return {
        question: byId.get(item.questionId)!, sourceQuestionId: item.questionId,
        points: item.points, sectionId: item.sectionId, orderIndex: index + 1,
      };
    }
    return {
      question: toInlineSnapshot(item.question, index),
      sourceQuestionId: null,
      points: item.points,
      sectionId: item.sectionId,
      orderIndex: index + 1,
    };
  });
  const updated = await repo.replaceQuestions(
    examId,
    teacherId,
    exam.updatedAt,
    rows,
  );
  if (!updated)
    throw new ConflictError(
      "Exam was changed in another session; reload and try again",
    );
  return toTeacherExamDto(updated, teacherId);
}

export async function submit(teacherId: string, examId: string) {
  const exam = await requireOwnedDraft(teacherId, examId);
  if (!exam._count.examQuestions)
    throw new ValidationError("Exam must contain at least one question");
  const teacher = await teacherContext(teacherId);
  const isHead = teacher.position === "DEPARTMENT_HEAD";

  const data =
    exam.type === "FINAL"
      ? isHead
        ? {
            status: "READY" as const,
            approvalStatus: "APPROVED" as const,
            reviewedById: teacherId,
            reviewedAt: new Date(),
            rejectionReason: null,
          }
        : { approvalStatus: "PENDING" as const, rejectionReason: null }
      : {
          status: "READY" as const,
          approvalStatus: "NOT_REQUIRED" as const,
          rejectionReason: null,
        };

  const result = await lifecycleRepo.transitionExam(
    examId,
    {
      createdById: teacherId,
      status: "DRAFT",
      approvalStatus: { not: "PENDING" },
    },
    data,
  );
  if (!result.count)
    throw new ConflictError("Exam state changed; reload and try again");
  return toTeacherExamDto((await repo.findExam(examId))!, teacherId);
}

export async function copy(teacherId: string, examId: string) {
  const exam = await repo.findExam(examId);
  if (!exam || exam.createdById !== teacherId)
    throw new NotFoundError("Exam not found");
  return toTeacherExamDto(
    await lifecycleRepo.copyExam(examId, teacherId),
    teacherId,
  );
}

export async function remove(teacherId: string, examId: string) {
  if (!(await lifecycleRepo.deleteDraftExam(examId, teacherId)))
    throw new ConflictError(
      "Only an unlocked draft without schedules can be deleted",
    );
  return { id: examId, deleted: true };
}

export async function listApprovals(
  teacherId: string,
  query: ExamApprovalQuery,
) {
  const teacher = await teacherContext(teacherId);
  if (teacher.position !== "DEPARTMENT_HEAD")
    throw new ForbiddenError("Department head permission required");
  const [total, rows] = await repo.listApprovals(teacher.departmentId!, query);
  return {
    items: rows.map((row) => toTeacherExamDto(row, teacherId)),
    pagination: toPagination(query.page, query.pageSize, total),
  };
}

async function review(
  teacherId: string,
  examId: string,
  approved: boolean,
  reason?: string,
) {
  const teacher = await teacherContext(teacherId);
  if (teacher.position !== "DEPARTMENT_HEAD")
    throw new ForbiddenError("Department head permission required");
  const exam = await repo.findExam(examId);
  if (
    !exam ||
    exam.subject.departmentId !== teacher.departmentId ||
    exam.type !== "FINAL"
  )
    throw new NotFoundError("Approval request not found");
  if (exam.createdById === teacherId)
    throw new ForbiddenError("Cannot review your own exam");
  const reviewed = await lifecycleRepo.reviewExam(
    examId,
    teacherId,
    approved,
    reason,
  );
  if (!reviewed) throw new ConflictError("Exam has already been reviewed");
  return toTeacherExamDto(reviewed, teacherId);
}

export const approve = (teacherId: string, examId: string) =>
  review(teacherId, examId, true);
export const reject = (teacherId: string, examId: string, reason: string) =>
  review(teacherId, examId, false, reason);

export async function extendAttemptTime(
  teacherId: string,
  input: { attemptId: string; extraMinutes: number; reason: string },
) {
  const teacher = await teacherContext(teacherId);
  const attempt = await repo.findAttemptForExtension(
    input.attemptId,
    teacherId,
  );
  if (!attempt) throw new NotFoundError("Exam attempt not found");
  if (attempt.status !== "IN_PROGRESS") {
    throw new ConflictError(
      "Cannot extend time for completed or inactive attempt",
    );
  }

  const baseTime =
    attempt.deadlineAt > new Date() ? attempt.deadlineAt : new Date();
  const newDeadline = new Date(
    baseTime.getTime() + input.extraMinutes * 60_000,
  );

  const updated = await repo.updateAttemptDeadline(
    input.attemptId,
    attempt.deadlineAt,
    newDeadline,
    teacher.userId,
    input.reason,
  );
  if (!updated)
    throw new ConflictError("Exam attempt changed; reload and try again");

  return {
    attemptId: updated.id,
    extraMinutes: input.extraMinutes,
    newDeadline: updated.deadlineAt,
    studentName: attempt.student.user.fullName,
    reason: input.reason,
  };
}
