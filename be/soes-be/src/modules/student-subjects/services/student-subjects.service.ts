import { NotFoundError } from '../../../errors/AppError'
import type { GetSubjectsQuery } from '../validators/student-subjects.validator'
import type { StudentSubjectsDto } from '../dtos/student-subjects.dto'
import { toSubjectCardDto } from '../mappers/student-subjects.mapper'
import * as repo from '../repositories/student-subjects.repository'

export async function getStudentSubjects(
  studentId: string,
  query: GetSubjectsQuery,
): Promise<StudentSubjectsDto> {
  const { page, pageSize, keyword } = query

  // Resolve semester
  let semesterId = query.semesterId
  if (semesterId) {
    const exists = await repo.findSemesterById(semesterId)
    if (!exists) throw new NotFoundError('Semester not found')
  } else {
    const current = await repo.findCurrentSemester()
    semesterId = current?.id
  }

  // Semester options and subject data run in parallel
  const [semesterOptions, { totalItems, enrollments }] = await Promise.all([
    repo.findSemesterOptions(),
    semesterId
      ? repo.findStudentSubjects({ studentId, semesterId, keyword, page, pageSize })
      : Promise.resolve({ totalItems: 0, enrollments: [] }),
  ])

  const totalPages = Math.ceil(totalItems / pageSize) || 1

  return {
    items:             enrollments.map(toSubjectCardDto),
    pagination:        { page, pageSize, totalItems, totalPages },
    semesterOptions:   semesterOptions.map((s) => ({
      id: s.id,
      name: s.name,
      isCurrent: s.status === 'ACTIVE',
    })),
    currentSemesterId: semesterId ?? null,
  }
}
