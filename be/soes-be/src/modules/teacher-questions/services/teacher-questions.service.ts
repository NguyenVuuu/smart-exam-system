import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../../errors/AppError'
import { toPagination } from '../../../utils/pagination'
import * as repo from '../repositories/teacher-questions.repository'
import type { ApprovalQuery, QuestionBody, QuestionsQuery } from '../validators/teacher-questions.validator'
import { toQuestionApprovalDto, toTeacherQuestionDto } from '../mappers/teacher-question.mapper'

async function requireTeacher(teacherId: string) {
  const teacher = await repo.teacherDepartment(teacherId)
  if (!teacher?.departmentId) throw new ForbiddenError('Teacher department is required')
  return teacher
}

function validateQuestion(data: QuestionBody) {
  const normalized = data.options.map((option) => option.content.trim().toLowerCase())
  if (new Set(normalized).size !== normalized.length) throw new ValidationError('Question options must be unique')
  if (data.type === 'PROGRAMMING') {
    if (!data.language) throw new ValidationError('Programming language is required')
    if (data.options.length) throw new ValidationError('Programming question cannot have options')
    if (!data.testCases.length) throw new ValidationError('Programming question requires at least one test case')
    if (!data.testCases.some((test) => !test.isHidden)) {
      throw new ValidationError('Programming question requires at least one public test case')
    }
    return
  }
  if (data.testCases.length) throw new ValidationError('Objective question cannot have programming test cases')
  if (data.options.length < 2) throw new ValidationError('At least two options are required')
  const correct = data.options.filter((option) => option.isCorrect).length
  if (data.type === 'MULTIPLE_CHOICE' ? correct < 1 : correct !== 1) {
    throw new ValidationError('Invalid number of correct options')
  }
  if (data.type === 'TRUE_FALSE' && data.options.length !== 2) throw new ValidationError('True/false question must have two options')
}

export async function list(teacherId: string, query: QuestionsQuery) {
  const teacher = await requireTeacher(teacherId)
  const [total, items] = await repo.listQuestions(teacherId, teacher.departmentId!, query)
  return { items: items.map(toTeacherQuestionDto), pagination: toPagination(query.page, query.pageSize, total) }
}

export async function listSubjects(teacherId: string) {
  const teacher = await requireTeacher(teacherId)
  return repo.listActiveSubjects(teacher.departmentId!)
}

export async function create(teacherId: string, data: QuestionBody) {
  const teacher = await requireTeacher(teacherId)
  validateQuestion(data)
  const subjectAllowed = await repo.findSubjectInDepartment(data.subjectId, teacher.departmentId!)
  if (!subjectAllowed) throw new ForbiddenError('Subject is outside teacher department')
  return toTeacherQuestionDto(await repo.createQuestion(teacherId, data))
}

export async function update(teacherId: string, id: string, data: QuestionBody) {
  const question = await repo.findOwnedQuestion(id, teacherId)
  if (!question) throw new NotFoundError('Question not found')
  if (question.questionBankItem && ['PENDING', 'APPROVED'].includes(question.questionBankItem.status) && !question.questionBankItem.removedAt) {
    throw new ConflictError('Pending or active shared questions cannot be edited')
  }
  validateQuestion(data)
  const teacher = await requireTeacher(teacherId)
  const subjectAllowed = await repo.findSubjectInDepartment(data.subjectId, teacher.departmentId!)
  if (!subjectAllowed) throw new ForbiddenError('Subject is outside teacher department')
  const updated = await repo.updateQuestion(id, teacherId, question.updatedAt, data)
  if (!updated) throw new ConflictError('Question changed in another session; reload and try again')
  return toTeacherQuestionDto(updated)
}

export async function archive(teacherId: string, id: string, archived: boolean) {
  const question = await repo.findOwnedQuestion(id, teacherId)
  if (!question) throw new NotFoundError('Question not found')
  if (question.questionBankItem && ['PENDING', 'APPROVED'].includes(question.questionBankItem.status) && !question.questionBankItem.removedAt) {
    throw new ConflictError('Pending or active shared questions cannot be archived')
  }
  const updated = await repo.setArchived(id, teacherId, question.updatedAt, archived)
  if (!updated) throw new ConflictError('Question changed in another session; reload and try again')
  return toTeacherQuestionDto(updated)
}

export async function share(teacherId: string, id: string) {
  const teacher = await requireTeacher(teacherId)
  const question = await repo.findOwnedQuestion(id, teacherId)
  if (!question) throw new NotFoundError('Question not found')
  if (question.archivedAt) throw new ConflictError('Archived questions must be restored before sharing')
  if (question.questionBankItem?.status === 'PENDING' && !question.questionBankItem.removedAt) {
    throw new ConflictError('Question is already pending approval')
  }
  if (question.questionBankItem?.status === 'APPROVED' && !question.questionBankItem.removedAt) {
    throw new ConflictError('Question is already in shared bank')
  }

  const isHead = teacher.position === 'DEPARTMENT_HEAD'
  const item = await repo.submitToSharedBank(
    id,
    question.subjectId,
    teacher.userId,
    isHead ? { reviewedByTeacherId: teacherId, reviewedAt: new Date() } : undefined,
  )
  return { itemId: item.id, status: item.status }
}

export async function listApprovals(teacherId: string, query: ApprovalQuery) {
  const teacher = await requireTeacher(teacherId)
  if (teacher.position !== 'DEPARTMENT_HEAD') throw new ForbiddenError('Department head permission required')
  const [total, items] = await repo.listApprovals(teacher.departmentId!, query)
  return { items: items.map(toQuestionApprovalDto), pagination: toPagination(query.page, query.pageSize, total) }
}

async function requireReviewable(teacherId: string, itemId: string) {
  const teacher = await requireTeacher(teacherId)
  if (teacher.position !== 'DEPARTMENT_HEAD') throw new ForbiddenError('Department head permission required')
  const item = await repo.findBankItem(itemId)
  if (!item || item.question.subject.departmentId !== teacher.departmentId) throw new NotFoundError('Approval request not found')
  if (item.question.ownerId === teacherId) throw new ForbiddenError('Cannot review your own question')
  if (item.status !== 'PENDING') throw new ConflictError('Approval request has already been reviewed')
  return { item, teacher }
}

export async function approve(teacherId: string, itemId: string) {
  const { teacher } = await requireReviewable(teacherId, itemId)
  if (!await repo.reviewBankItem(itemId, teacherId, teacher.userId, true)) throw new ConflictError('Approval request has already been reviewed')
  return { id: itemId, status: 'APPROVED' }
}

export async function reject(teacherId: string, itemId: string, reason: string) {
  const { teacher } = await requireReviewable(teacherId, itemId)
  if (!await repo.reviewBankItem(itemId, teacherId, teacher.userId, false, reason)) throw new ConflictError('Approval request has already been reviewed')
  return { id: itemId, status: 'REJECTED' }
}

export async function remove(teacherId: string, itemId: string, reason: string) {
  const teacher = await requireTeacher(teacherId)
  if (teacher.position !== 'DEPARTMENT_HEAD') throw new ForbiddenError('Department head permission required')
  const item = await repo.findBankItem(itemId)
  if (!item || item.question.subject.departmentId !== teacher.departmentId) throw new NotFoundError('Shared question not found')
  if (item.status !== 'APPROVED' || item.removedAt) throw new ConflictError('Question is not active in shared bank')
  if (!await repo.removeBankItem(itemId, teacherId, teacher.userId, reason)) throw new ConflictError('Question is not active in shared bank')
  return { id: itemId, removed: true }
}
