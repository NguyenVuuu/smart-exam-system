import type { SubjectCardDto } from '../dtos/student-subjects.dto'

interface EnrollmentRow {
  courseOffering: {
    id: string
    subject: { id: string; code: string; name: string }
    teacher: { user: { fullName: string } }
    _count: { materials: number }
    scheduleCourses: Array<{ id: string }>
  }
}

export function toSubjectCardDto(row: EnrollmentRow): SubjectCardDto {
  const co = row.courseOffering
  return {
    courseOfferingId: co.id,
    subjectId:        co.subject.id,
    subjectCode:      co.subject.code,
    subjectName:      co.subject.name,
    teacherName:      co.teacher.user.fullName,
    materialCount:    co._count.materials,
    examCount:        co.scheduleCourses.length,
  }
}
