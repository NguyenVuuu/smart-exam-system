import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../../errors/AppError'
import { toPagination } from '../../../utils/pagination'
import { toTeacherExamDetailDto, toTeacherExamDto } from '../mappers/teacher-exam.mapper'
import * as repo from '../repositories/teacher-exams.repository'
import * as lifecycleRepo from '../repositories/teacher-exam-lifecycle.repository'
import type { ExamApprovalQuery, ExamBody, ExamQuestionInput, ExamsQuery } from '../validators/teacher-exams.validator'

async function teacherContext(teacherId: string) {
  const teacher = await repo.findTeacherContext(teacherId)
  if (!teacher?.departmentId) throw new ForbiddenError('Teacher department is required')
  return teacher
}

async function requireOwnedDraft(teacherId: string, examId: string) {
  const exam = await repo.findExam(examId)
  if (!exam || exam.createdById !== teacherId) throw new NotFoundError('Exam not found')
  if (exam.status !== 'DRAFT' || exam.approvalStatus === 'PENDING') throw new ConflictError('Exam is locked for editing')
  return exam
}

export async function list(teacherId: string, query: ExamsQuery) {
  const [total, rows] = await repo.listOwnedExams(teacherId, query)
  return { items: rows.map((row) => toTeacherExamDto(row, teacherId)), pagination: toPagination(query.page, query.pageSize, total) }
}

export async function get(teacherId: string, examId: string) {
  const exam = await repo.findExamDetail(examId)
  if (!exam || exam.createdById !== teacherId) throw new NotFoundError('Exam not found')
  return toTeacherExamDetailDto(exam, teacherId)
}

async function validateSubject(teacherId: string, subjectId: string) {
  const teacher = await teacherContext(teacherId)
  const subject = await repo.findSubjectInDepartment(subjectId, teacher.departmentId!)
  if (!subject) throw new ForbiddenError('Subject is outside teacher department')
}

export async function create(teacherId: string, data: ExamBody) {
  await validateSubject(teacherId, data.subjectId)
  return toTeacherExamDto(await repo.createExam(teacherId, data), teacherId)
}

export async function update(teacherId: string, examId: string, data: ExamBody) {
  const exam = await requireOwnedDraft(teacherId, examId)
  await validateSubject(teacherId, data.subjectId)
  const existingIds = new Set(exam.sections.map(({ id }) => id))
  const newIds = data.sections.filter(({ id }) => !existingIds.has(id)).map(({ id }) => id)
  if (newIds.length && await repo.countExistingSections(newIds)) {
    throw new ValidationError('One or more exam sections belong to another exam')
  }
  const removedWithQuestions = exam.sections.some(({ id, _count }) =>
    !data.sections.some((section) => section.id === id) && _count.questions > 0)
  if (removedWithQuestions) throw new ConflictError('Move or remove questions before deleting their section')

  const updated = await repo.updateExam(examId, teacherId, exam.updatedAt, existingIds, data)
  if (!updated) throw new ConflictError('Exam was changed in another session; reload and try again')
  return toTeacherExamDto(updated, teacherId)
}

export async function replaceQuestions(teacherId: string, examId: string, items: ExamQuestionInput[]) {
  const exam = await requireOwnedDraft(teacherId, examId)
  const uniqueIds = [...new Set(items.map(({ questionId }) => questionId))]
  if (uniqueIds.length !== items.length) throw new ValidationError('Exam questions must be unique')
  const questions = await repo.findAvailableQuestions(teacherId, exam.subjectId, uniqueIds)
  if (questions.length !== items.length) throw new ValidationError('One or more questions are unavailable')
  const total = items.reduce((sum, item) => sum + item.points, 0)
  if (Math.abs(total - Number(exam.totalPoints)) > 0.001) throw new ValidationError('Question points must equal exam total points')
  const byId = new Map(questions.map((question) => [question.id, question]))
  const sectionIds = new Set(exam.sections?.map(({ id }) => id) ?? [])
  if (items.some(({ sectionId }) => sectionId && !sectionIds.has(sectionId))) {
    throw new ValidationError('One or more exam sections are invalid')
  }
  const rows = items.map((item, index) => ({
    question: byId.get(item.questionId)!, points: item.points,
    sectionId: item.sectionId, orderIndex: index + 1,
  }))
  const updated = await repo.replaceQuestions(examId, teacherId, exam.updatedAt, rows)
  if (!updated) throw new ConflictError('Exam was changed in another session; reload and try again')
  return toTeacherExamDto(updated, teacherId)
}

export async function submit(teacherId: string, examId: string) {
  const exam = await requireOwnedDraft(teacherId, examId)
  if (!exam._count.examQuestions) throw new ValidationError('Exam must contain at least one question')
  const teacher = await teacherContext(teacherId)
  const isHead = teacher.position === 'DEPARTMENT_HEAD'

  const data =
    exam.type === 'FINAL'
      ? isHead
        ? {
            status: 'READY' as const,
            approvalStatus: 'APPROVED' as const,
            reviewedById: teacherId,
            reviewedAt: new Date(),
            rejectionReason: null,
          }
        : { approvalStatus: 'PENDING' as const, rejectionReason: null }
      : { status: 'READY' as const, approvalStatus: 'NOT_REQUIRED' as const, rejectionReason: null }

  const result = await lifecycleRepo.transitionExam(
    examId,
    { createdById: teacherId, status: 'DRAFT', approvalStatus: { not: 'PENDING' } },
    data,
  )
  if (!result.count) throw new ConflictError('Exam state changed; reload and try again')
  return toTeacherExamDto((await repo.findExam(examId))!, teacherId)
}

export async function copy(teacherId: string, examId: string) {
  const exam = await repo.findExam(examId)
  if (!exam || exam.createdById !== teacherId) throw new NotFoundError('Exam not found')
  return toTeacherExamDto(await lifecycleRepo.copyExam(examId, teacherId), teacherId)
}

export async function remove(teacherId: string, examId: string) {
  if (!await lifecycleRepo.deleteDraftExam(examId, teacherId)) throw new ConflictError('Only an unlocked draft without schedules can be deleted')
  return { id: examId, deleted: true }
}

export async function listApprovals(teacherId: string, query: ExamApprovalQuery) {
  const teacher = await teacherContext(teacherId)
  if (teacher.position !== 'DEPARTMENT_HEAD') throw new ForbiddenError('Department head permission required')
  const [total, rows] = await repo.listApprovals(teacher.departmentId!, query)
  return { items: rows.map((row) => toTeacherExamDto(row, teacherId)), pagination: toPagination(query.page, query.pageSize, total) }
}

async function review(teacherId: string, examId: string, approved: boolean, reason?: string) {
  const teacher = await teacherContext(teacherId)
  if (teacher.position !== 'DEPARTMENT_HEAD') throw new ForbiddenError('Department head permission required')
  const exam = await repo.findExam(examId)
  if (!exam || exam.subject.departmentId !== teacher.departmentId || exam.type !== 'FINAL') throw new NotFoundError('Approval request not found')
  if (exam.createdById === teacherId) throw new ForbiddenError('Cannot review your own exam')
  const reviewed = await lifecycleRepo.reviewExam(examId, teacherId, approved, reason)
  if (!reviewed) throw new ConflictError('Exam has already been reviewed')
  return toTeacherExamDto(reviewed, teacherId)
}

export const approve = (teacherId: string, examId: string) => review(teacherId, examId, true)
export const reject = (teacherId: string, examId: string, reason: string) => review(teacherId, examId, false, reason)

export async function extendAttemptTime(
  teacherId: string,
  input: { attemptId: string; extraMinutes: number; reason: string },
) {
  const teacher = await teacherContext(teacherId)
  const attempt = await repo.findAttemptForExtension(input.attemptId, teacherId)
  if (!attempt) throw new NotFoundError('Exam attempt not found')
  if (attempt.status !== 'IN_PROGRESS') {
    throw new ConflictError('Cannot extend time for completed or inactive attempt')
  }

  const baseTime = attempt.deadlineAt > new Date() ? attempt.deadlineAt : new Date()
  const newDeadline = new Date(baseTime.getTime() + input.extraMinutes * 60_000)

  const updated = await repo.updateAttemptDeadline(
    input.attemptId, attempt.deadlineAt, newDeadline, teacher.userId, input.reason,
  )
  if (!updated) throw new ConflictError('Exam attempt changed; reload and try again')

  return {
    attemptId: updated.id,
    extraMinutes: input.extraMinutes,
    newDeadline: updated.deadlineAt,
    studentName: attempt.student.user.fullName,
    reason: input.reason,
  }
}
