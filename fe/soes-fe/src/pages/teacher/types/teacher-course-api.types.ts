export interface TeacherCourseApiDto {
  id: string
  code: string
  status: 'ACTIVE' | 'CLOSED'
  semester: { id: string; code: string; name: string; status: 'UPCOMING' | 'ACTIVE' | 'CLOSED' }
  subject: { id: string; code: string; name: string }
  enrollmentCount: number
  scheduleCount: number
}

export interface TeacherCourseDetailApiDto extends TeacherCourseApiDto {
  maxCapacity: number
  teacher: { id: string; fullName: string }
  students: Array<{
    id: string; studentId: string; studentCode: string; fullName: string; email: string | null; enrolledAt: string
  }>
  materials: Array<{
    id: string; fileName: string; fileSize: number; contentType: string; aiEnabled: boolean; createdAt: string
  }>
  posts: Array<{
    id: string; title: string; content: string; status: string; publishedAt: string | null; createdAt: string
    teacherName: string; isPinned: boolean; attachments: Array<{ id: string; fileName: string; fileSize: number }>
  }>
  exams: Array<{
    scheduleId: string; examId: string; title: string; totalPoints: number
    startTime: string; endTime: string; status: string
  }>
}

export type ProctorAssignmentStatus = 'SCHEDULED' | 'OPEN' | 'CLOSED' | 'CANCELLED'

export interface ProctorAssignmentApiDto {
  id: string
  scheduleId: string
  title: string
  startTime: string
  endTime: string
  status: ProctorAssignmentStatus
  source: 'ASSIGNED' | 'CREATED'
  courseOffering: {
    id: string
    code: string
    subjectName: string
  }
}

export interface TeacherPage<T> {
  items: T[]
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number }
}

export interface TeacherCoursesResponse extends TeacherPage<TeacherCourseApiDto> {
  semesterOptions: Array<{
    id: string
    code: string
    name: string
    status: 'UPCOMING' | 'ACTIVE' | 'CLOSED'
  }>
  currentSemesterId: string | null
}

export type CourseStudentApiDto = TeacherCourseDetailApiDto['students'][number]
export type CourseExamApiDto = TeacherCourseDetailApiDto['exams'][number]
export interface CourseGradebookApiDto {
  assessments: Array<{
    scheduleId: string; title: string; type: string; totalPoints: number; resultsPublished: boolean
  }>
  students: Array<{
    studentId: string; studentCode: string; fullName: string
    scores: Record<string, number | null>; averageScore: number | null
  }>
  pagination: TeacherPage<never>['pagination']
}
