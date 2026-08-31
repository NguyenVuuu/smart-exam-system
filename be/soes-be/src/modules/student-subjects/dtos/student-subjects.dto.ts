export interface SubjectCardDto {
  courseOfferingId: string
  subjectId: string
  subjectCode: string
  subjectName: string
  teacherName: string
  materialCount: number
  examCount: number
}

export interface PaginationDto {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface SemesterOptionDto {
  id: string
  name: string
  isCurrent: boolean
}

export interface StudentSubjectsDto {
  items: SubjectCardDto[]
  pagination: PaginationDto
  semesterOptions: SemesterOptionDto[]
  currentSemesterId: string | null
}
