import bcrypt from "bcrypt";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../../errors/AppError";
import { runSerializable } from "../../../utils/transaction";
import {
  computeScheduleStatus,
  toExamScheduleDto,
} from "../../exam-schedules/mappers/exam-schedule.mapper";
import * as scheduleRepo from "../../exam-schedules/repositories/exam-schedule.repository";
import type { ScheduleWriteInput } from "../../exam-schedules/types/exam-schedule.types";
import * as repo from "../repositories/teacher-exam-schedule.repository";
import type { TeacherExamScheduleBody } from "../validators/teacher-exam-schedule.validator";

async function toWriteInput(
  teacherId: string,
  examId: string,
  title: string,
  courseCode: string,
  data: TeacherExamScheduleBody,
  preservePassword = false,
): Promise<ScheduleWriteInput> {
  const passwordHash = data.password
    ? await bcrypt.hash(data.password, 10)
    : preservePassword && data.password === undefined
      ? undefined
      : null;
  return {
    title: `${courseCode} - ${title}`,
    examId,
    startTime: data.startTime,
    endTime: data.endTime,
    durationMinutes: data.durationMinutes,
    maxAttempts: data.maxAttempts,
    passwordHash,
    enableTabLock: true,
    maxTabSwitches: null,
    requireFullscreen: data.requireFullscreen,
    enableWebcam: data.enableWebcam,
    blockCopyPaste: data.blockCopyPaste,
    blockRightClick: data.blockRightClick,
    locationMode: data.locationMode,
    allowedIpRanges: data.allowedIpRanges,
    distributionMode: data.distributionMode,
    randomQuestionCount: data.randomQuestionCount ?? null,
    resultReleaseMode: data.resultReleaseMode,
    resultReleaseAt: data.resultReleaseAt ?? null,
    reviewPolicy: data.allowStudentReview ? "FULL_AFTER_RELEASE" : "NONE",
    reviewStartAt: null,
    reviewEndAt: null,
    status: "SCHEDULED",
    courses: [
      { courseOfferingId: data.courseOfferingId, teacherIds: [teacherId] },
    ],
  };
}

async function context(
  teacherId: string,
  examId: string,
  courseOfferingId: string,
) {
  const [exam, course] = await Promise.all([
    repo.findOwnedExam(teacherId, examId),
    repo.findOwnedCourse(teacherId, courseOfferingId),
  ]);
  if (!exam) throw new NotFoundError("Exam not found");
  if (exam.type === "FINAL")
    throw new ValidationError(
      "Final exams must be centrally scheduled by an administrator",
    );
  if (exam.status !== "READY" || !exam._count.examQuestions)
    throw new ValidationError("Exam must be ready and contain questions");
  if (!course || course.subjectId !== exam.subjectId || course.semesterId !== exam.semesterId)
    throw new ValidationError(
      "Course offering is unavailable or belongs to another subject or semester",
    );
  return { exam, course };
}

async function assertNoConflict(
  tx: Parameters<Parameters<typeof runSerializable>[0]>[0],
  teacherId: string,
  courseId: string,
  input: ScheduleWriteInput,
  excludeId?: string,
) {
  const [courseConflict, proctorConflict] =
    await scheduleRepo.findScheduleConflicts(
      tx,
      [courseId],
      [teacherId],
      input.startTime,
      input.endTime,
      excludeId,
    );
  if (courseConflict)
    throw new ConflictError(
      `Course offering ${courseConflict.courseOffering.code} already has an overlapping exam`,
    );
  if (proctorConflict)
    throw new ConflictError(
      "You already have an overlapping proctor assignment, including the 5-minute turnover period",
    );
}

export async function list(teacherId: string, examId: string) {
  await repo.findAccessibleExam(teacherId, examId).then((exam) => {
    if (!exam) throw new NotFoundError("Exam not found");
  });
  return (await repo.listExamSchedules(teacherId, examId)).map(
    toExamScheduleDto,
  );
}

export async function create(
  teacherId: string,
  userId: string,
  examId: string,
  data: TeacherExamScheduleBody,
) {
  const { exam, course } = await context(teacherId, examId, data.courseOfferingId);
  const input = await toWriteInput(teacherId, examId, exam.title, course.code, data);
  return toExamScheduleDto(
    await runSerializable(async (tx) => {
      await assertNoConflict(tx, teacherId, data.courseOfferingId, input);
      return scheduleRepo.createSchedule(tx, input, userId);
    }),
  );
}

export async function update(
  teacherId: string,
  userId: string,
  examId: string,
  scheduleId: string,
  data: TeacherExamScheduleBody,
) {
  const { exam, course } = await context(teacherId, examId, data.courseOfferingId);
  const input = await toWriteInput(teacherId, examId, exam.title, course.code, data, true);
  return toExamScheduleDto(
    await runSerializable(async (tx) => {
      const current = await repo.findOwnedSchedule(
        tx,
        teacherId,
        userId,
        scheduleId,
      );
      if (!current) throw new NotFoundError("Exam schedule not found");
      if (current.exam.status === "LOCKED")
        throw new ConflictError(
          "Exam distribution is locked; reopen it before updating a schedule",
        );
      const status = computeScheduleStatus(
        current.status,
        current.startTime,
        current.endTime,
      );
      if (!["DRAFT", "SCHEDULED"].includes(status) || current._count.attempts)
        throw new ConflictError("Exam schedule is locked");
      await assertNoConflict(
        tx,
        teacherId,
        data.courseOfferingId,
        input,
        scheduleId,
      );
      return scheduleRepo.updateSchedule(tx, scheduleId, input);
    }),
  );
}

export async function cancel(
  teacherId: string,
  userId: string,
  scheduleId: string,
  reason: string,
) {
  return toExamScheduleDto(
    await runSerializable(async (tx) => {
      const current = await repo.findOwnedSchedule(
        tx,
        teacherId,
        userId,
        scheduleId,
      );
      if (!current) throw new NotFoundError("Exam schedule not found");
      if (current.exam.status === "LOCKED")
        throw new ConflictError(
          "Exam distribution is locked; reopen it before cancelling a schedule",
        );
      const status = computeScheduleStatus(
        current.status,
        current.startTime,
        current.endTime,
      );
      if (!["DRAFT", "SCHEDULED"].includes(status))
        throw new ConflictError("Exam schedule cannot be cancelled");
      return scheduleRepo.cancelSchedule(tx, scheduleId, reason);
    }),
  );
}
