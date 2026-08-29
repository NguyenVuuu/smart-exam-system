import { ConflictError, NotFoundError } from '../../../errors/AppError'
import { toPagination } from '../../../utils/pagination'
import * as departmentRepo from '../repositories/department.repository'
import * as repo from '../repositories/subject.repository'
import type { SubjectBody, SubjectQuery } from '../validators/academic.validator'
import { toSubjectDto } from '../mappers/academic.mapper'

export async function list(query: SubjectQuery) {
  const [total, items] = await repo.listSubjects(query)
  return { items: items.map(toSubjectDto), pagination: toPagination(query.page, query.pageSize, total) }
}

async function validate(data: SubjectBody, currentId?: string) {
  if (!await departmentRepo.findDepartment(data.departmentId)) throw new NotFoundError('Department not found')
  const duplicate = await repo.findSubjectByCode(data.code)
  if (duplicate && duplicate.id !== currentId) throw new ConflictError('Subject code already exists')
}

export async function create(data: SubjectBody) {
  await validate(data)
  return toSubjectDto(await repo.createSubject(data))
}

export async function update(id: string, data: SubjectBody) {
  if (!await repo.findSubject(id)) throw new NotFoundError('Subject not found')
  await validate(data, id)
  return toSubjectDto(await repo.updateSubject(id, data))
}
