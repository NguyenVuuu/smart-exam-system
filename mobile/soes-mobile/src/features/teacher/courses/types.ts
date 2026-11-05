export interface TeacherCourse {
  id: string; code: string; status: 'ACTIVE' | 'CLOSED'
  semester: { id: string; name: string; code: string }
  subject: { id: string; code: string; name: string }
  enrollmentCount: number; scheduleCount: number
}
export interface CourseStudent { id: string; studentCode: string; fullName: string; email: string | null }
export interface CourseExam { scheduleId: string; examId: string; title: string; startTime: string; endTime: string; status: string }
export interface CourseMaterial { id: string; title: string | null; fileName: string; createdAt: string }
export interface CoursePost { id: string; title: string; content: string; status: string; isPinned: boolean; createdAt: string }
export interface CourseDetail extends TeacherCourse { students: CourseStudent[]; exams: CourseExam[]; materials: CourseMaterial[]; posts: CoursePost[] }
export interface Page<T> { items: T[]; pagination: { page: number; totalPages: number; totalItems: number } }
