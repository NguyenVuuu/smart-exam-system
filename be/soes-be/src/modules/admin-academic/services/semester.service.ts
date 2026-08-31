import { ConflictError, NotFoundError, ValidationError } from '../../../errors/AppError'
import { toPagination } from '../../../utils/pagination'
import * as repo from '../repositories/semester.repository'
import type { SemesterBody, SemesterQuery } from '../validators/academic.validator'
import { toSemesterDto } from '../mappers/academic.mapper'

const termNumber = { TERM_1: 1, TERM_2: 2, TERM_3: 3 } as const

function semesterIdentity(data: SemesterBody) {
  const [startYear, endYear] = data.academicYear.split('-').map(Number)
  if (endYear !== startYear + 1) throw new ValidationError('Academic year must contain consecutive years')
  const term = termNumber[data.term]
  return {
    code: `HK${term}_${startYear}_${endYear}`,
    name: `Học kỳ ${term} - ${data.academicYear.replace('-', '/')}`,
  }
}

export async function list(query: SemesterQuery) {
  const [total, items] = await repo.listSemesters(query)
  return { items: items.map(toSemesterDto), pagination: toPagination(query.page, query.pageSize, total) }
}

export async function create(data: SemesterBody) {
  const identity = semesterIdentity(data)
  if (await repo.findSemesterByCode(identity.code)) throw new ConflictError('Semester code already exists')
  return toSemesterDto(await repo.createSemester(identity.code, identity.name, data))
}

export async function update(id: string, data: SemesterBody) {
  if (!await repo.findSemester(id)) throw new NotFoundError('Semester not found')
  const identity = semesterIdentity(data)
  const duplicate = await repo.findSemesterByCode(identity.code)
  if (duplicate && duplicate.id !== id) throw new ConflictError('Semester code already exists')
  return toSemesterDto(await repo.updateSemester(id, data, identity.code, identity.name))
}

export async function activate(id: string) {
  const semester = await repo.findSemester(id)
  if (!semester) throw new NotFoundError('Semester not found')
  return toSemesterDto(await repo.activateSemester(id))
}
