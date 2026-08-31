export interface SemesterDto {
  id: string; code: string; name: string; academicYear: string; term: string
  startDate: Date; endDate: Date; status: string; courseOfferingCount: number
}

export interface DepartmentDto {
  id: string; code: string; name: string; description: string | null; status: string
  subjectCount: number; teacherCount: number
  head: { id: string; code: string; fullName: string } | null
}

export interface SubjectDto {
  id: string; code: string; name: string; description: string | null; credits: number; status: string
  department: { id: string; code: string; name: string }; courseOfferingCount: number
}

export interface CourseOfferingDto {
  id: string; code: string; status: string; maxCapacity: number
  semester: { id: string; code: string; name: string }
  subject: { id: string; code: string; name: string; departmentId: string }
  teacher: { id: string; code: string; fullName: string }
  enrollmentCount: number; scheduleCount: number
}
