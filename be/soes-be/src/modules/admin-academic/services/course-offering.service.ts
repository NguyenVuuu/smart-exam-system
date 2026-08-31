import { ConflictError, NotFoundError, ValidationError } from '../../../errors/AppError'
import { toPagination } from '../../../utils/pagination'
import * as repo from '../repositories/course-offering.repository'
import type { CourseOfferingBody, CourseOfferingQuery } from '../validators/academic.validator'
import { toCourseOfferingDto } from '../mappers/academic.mapper'

export async function list(query: CourseOfferingQuery) {
  const [total, items] = await repo.listCourseOfferings(query)
  return { items: items.map(toCourseOfferingDto), pagination: toPagination(query.page, query.pageSize, total) }
}

async function validate(data: CourseOfferingBody, currentId?: string) {
  const [semester, subject, teacher, duplicate] = await repo.findCourseOfferingContext(data)
  if (!semester) throw new NotFoundError('Semester not found')
  if (!subject) throw new NotFoundError('Subject not found')
  if (!teacher) throw new NotFoundError('Teacher not found')
  if (data.status === 'ACTIVE' && (semester.status !== 'ACTIVE' || subject.status !== 'ACTIVE' || teacher.status !== 'ACTIVE')) {
    throw new ValidationError('Active course offering requires the current semester, active subject, and active teacher')
  }
  if (teacher.departmentId !== subject.departmentId) throw new ValidationError('Teacher and subject must belong to the same department')
  if (duplicate && duplicate.id !== currentId) throw new ConflictError('Course offering code already exists')
}

export async function create(data: CourseOfferingBody) {
  await validate(data)
  return toCourseOfferingDto(await repo.createCourseOffering(data))
}

export async function update(id: string, data: CourseOfferingBody) {
  const current = await repo.findCourseOffering(id)
  if (!current) throw new NotFoundError('Course offering not found')
  if (data.maxCapacity < current._count.enrollments) throw new ValidationError('Capacity cannot be lower than current enrollment')
  const changesScope = data.subjectId !== current.subjectId || data.semesterId !== current.semesterId
  if (changesScope && (current._count.enrollments > 0 || current._count.scheduleCourses > 0)) {
    throw new ConflictError('Subject or semester cannot be changed after enrollment or scheduling')
  }
  await validate(data, id)
  return toCourseOfferingDto(await repo.updateCourseOffering(id, data))
}
