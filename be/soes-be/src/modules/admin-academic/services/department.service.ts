import { ConflictError, NotFoundError } from '../../../errors/AppError'
import { toPagination } from '../../../utils/pagination'
import { runSerializable } from '../../../utils/transaction'
import * as repo from '../repositories/department.repository'
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

export async function assignHead(departmentId: string, teacherId: string | null) {
  if (!await repo.findDepartment(departmentId)) throw new NotFoundError('Department not found')
  return runSerializable(async (tx) => {
    if (teacherId) {
      const teacher = await repo.findTeacherForHeadAssignment(tx, teacherId)
      if (!teacher || teacher.status !== 'ACTIVE') throw new NotFoundError('Active teacher not found')
      if (teacher.departmentId !== departmentId) throw new ConflictError('Teacher must belong to this department')
    }
    return repo.assignDepartmentHead(tx, departmentId, teacherId)
  })
}
