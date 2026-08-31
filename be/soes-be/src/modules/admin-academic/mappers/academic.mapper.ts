import type { Prisma } from '@prisma/client'
import type { CourseOfferingDto, DepartmentDto, SemesterDto, SubjectDto } from '../dtos/academic.dto'
import type { courseOfferingInclude } from '../repositories/course-offering.repository'
import type { departmentInclude } from '../repositories/department.repository'
import type { semesterInclude } from '../repositories/semester.repository'
import type { subjectInclude } from '../repositories/subject.repository'

type SemesterRow = Prisma.SemesterGetPayload<{ include: typeof semesterInclude }>
type DepartmentRow = Prisma.DepartmentGetPayload<{ include: typeof departmentInclude }>
type SubjectRow = Prisma.SubjectGetPayload<{ include: typeof subjectInclude }>
type CourseOfferingRow = Prisma.CourseOfferingGetPayload<{ include: typeof courseOfferingInclude }>

export const toSemesterDto = (row: SemesterRow): SemesterDto => ({
  id: row.id, code: row.code, name: row.name, academicYear: row.academicYear, term: row.term,
  startDate: row.startDate, endDate: row.endDate, status: row.status,
  courseOfferingCount: row._count?.courseOfferings ?? 0,
})

export const toDepartmentDto = (row: DepartmentRow): DepartmentDto => {
  const head = row.teachers?.[0]
  return {
    id: row.id, code: row.code, name: row.name, description: row.description ?? null, status: row.status,
    subjectCount: row._count?.subjects ?? 0, teacherCount: row._count?.teachers ?? 0,
    head: head ? { id: head.id, code: head.teacherCode, fullName: head.user.fullName } : null,
  }
}

export const toSubjectDto = (row: SubjectRow): SubjectDto => ({
  id: row.id, code: row.code, name: row.name, description: row.description ?? null,
  credits: row.credits, status: row.status, department: row.department,
  courseOfferingCount: row._count?.courseOfferings ?? 0,
})

export const toCourseOfferingDto = (row: CourseOfferingRow): CourseOfferingDto => ({
  id: row.id, code: row.code, status: row.status, maxCapacity: row.maxCapacity,
  semester: row.semester, subject: row.subject,
  teacher: { id: row.teacher.id, code: row.teacher.teacherCode, fullName: row.teacher.user.fullName },
  enrollmentCount: row._count?.enrollments ?? 0, scheduleCount: row._count?.scheduleCourses ?? 0,
})
