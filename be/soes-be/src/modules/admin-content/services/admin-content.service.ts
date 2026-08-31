import { ConflictError, ForbiddenError, NotFoundError } from '../../../errors/AppError'
import { toPagination } from '../../../utils/pagination'
import { runSerializable } from '../../../utils/transaction'
import { toAdminExamTrackingDto, toAdminQuestionBankItemDto } from '../mappers/admin-content.mapper'
import * as repo from '../repositories/admin-content.repository'
import type { ExamTrackingQuery, QuestionBankQuery } from '../validators/admin-content.validator'

export async function listQuestionBank(query: QuestionBankQuery) {
  const [total, rows] = await repo.listBank(query)
  return { items: rows.map(toAdminQuestionBankItemDto), pagination: toPagination(query.page, query.pageSize, total) }
}

export async function getQuestionBankItem(id: string) {
  const row = await repo.findBankItem(id)
  if (!row || row.status !== 'APPROVED') throw new NotFoundError('Shared question not found')
  return toAdminQuestionBankItemDto(row)
}

async function requireAdmin(userId: string) {
  const admin = await repo.adminActor(userId)
  if (!admin) throw new ForbiddenError('Admin permission required')
  return admin
}

export async function removeQuestion(userId: string, id: string, reason: string) {
  const admin = await requireAdmin(userId)
  return runSerializable(async (tx) => {
    const changed = await tx.questionBankItem.updateMany({
      where: { id, status: 'APPROVED', removedAt: null },
      data: { removedAt: new Date(), removedByAdminId: admin.id, removedByTeacherId: null, removalReason: reason },
    })
    if (!changed.count) throw new ConflictError('Question is not active in shared bank')
    await tx.auditLog.create({ data: {
      userId, action: 'REMOVE_SHARED_QUESTION', entityType: 'QuestionBankItem', entityId: id,
      metadata: { reason },
    } })
    return { id, removed: true }
  })
}

export async function restoreQuestion(userId: string, id: string) {
  await requireAdmin(userId)
  return runSerializable(async (tx) => {
    const changed = await tx.questionBankItem.updateMany({
      where: { id, status: 'APPROVED', removedAt: { not: null } },
      data: { removedAt: null, removedByAdminId: null, removedByTeacherId: null, removalReason: null },
    })
    if (!changed.count) throw new ConflictError('Question is not removed from shared bank')
    await tx.auditLog.create({ data: {
      userId, action: 'RESTORE_SHARED_QUESTION', entityType: 'QuestionBankItem', entityId: id,
    } })
    return { id, restored: true }
  })
}

export async function listExams(query: ExamTrackingQuery) {
  const [total, rows] = await repo.listExams(query)
  return { items: rows.map(toAdminExamTrackingDto), pagination: toPagination(query.page, query.pageSize, total) }
}
