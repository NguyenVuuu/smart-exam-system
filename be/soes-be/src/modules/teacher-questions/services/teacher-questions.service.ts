import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../../errors/AppError";
import { toPagination } from "../../../utils/pagination";
import * as repo from "../repositories/teacher-questions.repository";
import type {
  ApprovalQuery,
  QuestionBody,
  QuestionsQuery,
} from "../validators/teacher-questions.validator";
import {
  toQuestionApprovalDto,
  toTeacherQuestionDto,
} from "../mappers/teacher-question.mapper";
import { supabaseBuckets } from "../../../lib/supabase";
import { uploadBufferToBucket } from "../../../services/storage.service";
import { auditQuestion } from "./question-audit.rules";

async function requireTeacher(teacherId: string) {
  const teacher = await repo.teacherDepartment(teacherId);
  if (!teacher?.departmentId)
    throw new ForbiddenError("Teacher department is required");
  return teacher;
}

function validateQuestion(data: QuestionBody) {
  const blockingIssue = auditQuestion(data).find(
    ({ severity }) => severity === "HIGH",
  );
  if (blockingIssue) throw new ValidationError(blockingIssue.message);
}

export async function list(teacherId: string, query: QuestionsQuery) {
  const teacher = await requireTeacher(teacherId);
  const [total, items] = await repo.listQuestions(
    teacherId,
    teacher.departmentId!,
    query,
  );
  return {
    items: items.map(toTeacherQuestionDto),
    pagination: toPagination(query.page, query.pageSize, total),
  };
}

export async function listSubjects(teacherId: string) {
  const teacher = await requireTeacher(teacherId);
  return repo.listActiveSubjects(teacher.departmentId!);
}

export async function create(teacherId: string, data: QuestionBody) {
  const teacher = await requireTeacher(teacherId);
  validateQuestion(data);
  const subjectAllowed = await repo.findSubjectInDepartment(
    data.subjectId,
    teacher.departmentId!,
  );
  if (!subjectAllowed)
    throw new ForbiddenError("Subject is outside teacher department");
  return toTeacherQuestionDto(await repo.createQuestion(teacherId, data));
}

export async function update(
  teacherId: string,
  id: string,
  data: QuestionBody,
) {
  const question = await repo.findOwnedQuestion(id, teacherId);
  if (!question) throw new NotFoundError("Question not found");
  validateQuestion(data);
  const teacher = await requireTeacher(teacherId);
  const subjectAllowed = await repo.findSubjectInDepartment(
    data.subjectId,
    teacher.departmentId!,
  );
  if (!subjectAllowed)
    throw new ForbiddenError("Subject is outside teacher department");
  const updated = await repo.updateQuestion(
    id,
    teacherId,
    question.updatedAt,
    data,
    teacher.position === "DEPARTMENT_HEAD",
  );
  if (!updated)
    throw new ConflictError(
      "Question changed in another session; reload and try again",
    );
  return toTeacherQuestionDto(updated);
}

export async function archive(
  teacherId: string,
  id: string,
  archived: boolean,
) {
  const question = await repo.findOwnedQuestion(id, teacherId);
  if (!question) throw new NotFoundError("Question not found");
  if (
    question.questionBankItem &&
    ["PENDING", "APPROVED"].includes(question.questionBankItem.status) &&
    !question.questionBankItem.removedAt
  ) {
    throw new ConflictError(
      "Pending or active shared questions cannot be archived",
    );
  }
  const updated = await repo.setArchived(
    id,
    teacherId,
    question.updatedAt,
    archived,
  );
  if (!updated)
    throw new ConflictError(
      "Question changed in another session; reload and try again",
    );
  return toTeacherQuestionDto(updated);
}

export async function share(teacherId: string, id: string) {
  const teacher = await requireTeacher(teacherId);
  const question = await repo.findOwnedQuestion(id, teacherId);
  if (!question) throw new NotFoundError("Question not found");
  if (question.archivedAt)
    throw new ConflictError(
      "Archived questions must be restored before sharing",
    );
  if (
    question.questionBankItem?.status === "PENDING" &&
    !question.questionBankItem.removedAt
  ) {
    throw new ConflictError("Question is already pending approval");
  }
  if (
    question.questionBankItem?.status === "APPROVED" &&
    !question.questionBankItem.removedAt
  ) {
    throw new ConflictError("Question is already in shared bank");
  }

  const isHead = teacher.position === "DEPARTMENT_HEAD";
  const item = await repo.submitToSharedBank(
    id,
    question.subjectId,
    teacher.userId,
    isHead
      ? { reviewedByTeacherId: teacherId, reviewedAt: new Date() }
      : undefined,
  );
  return { itemId: item.id, status: item.status };
}

export async function listApprovals(teacherId: string, query: ApprovalQuery) {
  const teacher = await requireTeacher(teacherId);
  if (teacher.position !== "DEPARTMENT_HEAD")
    throw new ForbiddenError("Department head permission required");
  const [total, items] = await repo.listApprovals(teacher.departmentId!, query);
  return {
    items: items.map(toQuestionApprovalDto),
    pagination: toPagination(query.page, query.pageSize, total),
  };
}

async function requireReviewable(teacherId: string, itemId: string) {
  const teacher = await requireTeacher(teacherId);
  if (teacher.position !== "DEPARTMENT_HEAD")
    throw new ForbiddenError("Department head permission required");
  const item = await repo.findBankItem(itemId);
  if (!item || item.question.subject.departmentId !== teacher.departmentId)
    throw new NotFoundError("Approval request not found");
  if (item.question.ownerId === teacherId)
    throw new ForbiddenError("Cannot review your own question");
  if (item.status !== "PENDING")
    throw new ConflictError("Approval request has already been reviewed");
  return { item, teacher };
}

export async function approve(teacherId: string, itemId: string) {
  const { teacher } = await requireReviewable(teacherId, itemId);
  if (!(await repo.reviewBankItem(itemId, teacherId, teacher.userId, true)))
    throw new ConflictError("Approval request has already been reviewed");
  return { id: itemId, status: "APPROVED" };
}

export async function reject(
  teacherId: string,
  itemId: string,
  reason: string,
) {
  const { teacher } = await requireReviewable(teacherId, itemId);
  if (
    !(await repo.reviewBankItem(
      itemId,
      teacherId,
      teacher.userId,
      false,
      reason,
    ))
  )
    throw new ConflictError("Approval request has already been reviewed");
  return { id: itemId, status: "REJECTED" };
}

export async function remove(
  teacherId: string,
  itemId: string,
  reason: string,
) {
  const teacher = await requireTeacher(teacherId);
  if (teacher.position !== "DEPARTMENT_HEAD")
    throw new ForbiddenError("Department head permission required");
  const item = await repo.findBankItem(itemId);
  if (!item || item.question.subject.departmentId !== teacher.departmentId)
    throw new NotFoundError("Shared question not found");
  if (item.status !== "APPROVED" || item.removedAt)
    throw new ConflictError("Question is not active in shared bank");
  if (!(await repo.removeBankItem(itemId, teacherId, teacher.userId, reason)))
    throw new ConflictError("Question is not active in shared bank");
  return { id: itemId, removed: true };
}
export async function uploadQuestionImage(
  teacherId: string,
  file?: Express.Multer.File,
) {
  if (!file) throw new ValidationError("Image file is required");
  await requireTeacher(teacherId);
  const stored = await uploadBufferToBucket(
    supabaseBuckets.questionImages,
    file,
    `teachers/${teacherId}/question-images`,
    { publicUrl: true },
  );
  return {
    location: stored.publicUrl,
    fileName: stored.originalName,
    storagePath: stored.storagePath,
    fileSize: stored.fileSize,
    contentType: stored.contentType,
  };
}

export async function uploadAiSourceFiles(
  teacherId: string,
  subjectId: string,
  files: Express.Multer.File[],
) {
  if (!files.length)
    throw new ValidationError("At least one source file is required");
  const teacher = await requireTeacher(teacherId);
  const subjectAllowed = await repo.findSubjectInDepartment(
    subjectId,
    teacher.departmentId!,
  );
  if (!subjectAllowed)
    throw new ForbiddenError("Subject is outside teacher department");

  const storedFiles = await Promise.all(
    files.map((file) =>
      uploadBufferToBucket(
        supabaseBuckets.aiSourceFiles,
        file,
        `teachers/${teacherId}/subjects/${subjectId}/ai-source-files`,
      ),
    ),
  );

  return storedFiles.map((file) => ({
    fileName: file.originalName,
    storagePath: file.storagePath,
    fileSize: file.fileSize,
    contentType: file.contentType,
    checksum: file.checksum,
  }));
}
