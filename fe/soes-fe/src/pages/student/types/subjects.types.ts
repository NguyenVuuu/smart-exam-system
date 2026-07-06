export interface SubjectCard {
  courseOfferingId: string
  subjectId: string
  subjectCode: string
  subjectName: string
  teacherName: string
  materialCount: number
  examCount: number
}

export interface Pagination {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface SemesterOption {
  id: string
  name: string
}

export interface StudentSubjectsResponse {
  items: SubjectCard[]
  pagination: Pagination
  semesterOptions: SemesterOption[]
  currentSemesterId: string | null
}
