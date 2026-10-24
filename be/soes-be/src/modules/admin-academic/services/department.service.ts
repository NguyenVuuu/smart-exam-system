import { ConflictError, NotFoundError } from '../../../errors/AppError'
import { toPagination } from '../../../utils/pagination'
import { runSerializable } from '../../../utils/transaction'
import * as repo from '../repositories/department.repository'
import { refreshOpenRounds } from '../../exam-review-groups/repositories/review-group.repository'
import type { DepartmentBody, DepartmentQuery } from '../validators/academic.validator'
import { toDepartmentDto } from '../mappers/academic.mapper'

export async function list(query: DepartmentQuery) {
  const [total, items] = await repo.listDepartments(query)
  return { items: items.map(toDepartmentDto), pagination: toPagination(query.page, query.pageSize, total) }
}

export async function create(data: DepartmentBody) {
  if (await repo.findDepartmentByCode(data.code)) throw new ConflictError('Department code already exists')
  return toDepartmentDto(await repo.createDepartment(data))
}

export async function update(id: string, data: DepartmentBody) {
  if (!await repo.findDepartment(id)) throw new NotFoundError('Department not found')
  const duplicate = await repo.findDepartmentByCode(data.code)
  if (duplicate && duplicate.id !== id) throw new ConflictError('Department code already exists')
  return toDepartmentDto(await repo.updateDepartment(id, data))
}

export async function assignHead(departmentId: string, teacherId: string | null, actorUserId: string) {
  if (!await repo.findDepartment(departmentId)) throw new NotFoundError('Department not found')
  return runSerializable(async (tx) => {
    const oldHeads = await tx.teacher.findMany({
      where: { departmentId, position: 'DEPARTMENT_HEAD' }, select: { id: true },
    })
    if (teacherId) {
      const teacher = await repo.findTeacherForHeadAssignment(tx, teacherId)
      if (!teacher || teacher.status !== 'ACTIVE' || teacher.user.status !== 'ACTIVE') {
        throw new NotFoundError('Active teacher not found')
      }
      if (teacher.departmentId !== departmentId) throw new ConflictError('Teacher must belong to this department')
    }
    const result = await repo.assignDepartmentHead(tx, departmentId, teacherId)
    const group = await tx.departmentReviewGroup.findUnique({ where: { departmentId }, select: { id: true } })
    if (group && teacherId) {
      await tx.departmentReviewMember.upsert({
        where: { groupId_teacherId: { groupId: group.id, teacherId } },
        create: { groupId: group.id, teacherId },
        update: { status: 'ACTIVE', leftAt: null },
      })
      await refreshOpenRounds(tx, group.id, departmentId)
    }
    await tx.auditLog.create({ data: {
      userId: actorUserId, action: 'DEPARTMENT_HEAD_ASSIGNED', entityType: 'Department', entityId: departmentId,
      metadata: { before: oldHeads.map((head) => head.id), after: teacherId },
    } })
    return result
  })
}
