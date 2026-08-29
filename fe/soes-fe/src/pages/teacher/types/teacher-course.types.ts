export interface CourseOffering {
  id: string
  subjectId: string
  subjectCode: string
  subjectName: string
  courseCode: string // Mã lớp học phần duy nhất (BR-05)
  semesterName: string
  semesterId: string
  teacherName: string
  totalStudents: number
  totalExams: number
  status: 'ACTIVE' | 'CLOSED'
  description?: string
}

export interface CourseMaterial {
  id: string
  courseOfferingId: string
  fileName: string
  fileType: 'PDF' | 'DOCX' | 'PPTX'
  fileSize: string
  uploadedAt: string
  selectedForAI: boolean // BR-10: Checkbox chọn tài liệu cho AI
  downloadUrl: string
}

export interface StudentEnrollment {
  id: string
  studentId: string
  studentCode: string
  fullName: string
  email: string
  enrolledAt: string
  status: 'ACTIVE' | 'DROPPED'
}

export interface CourseAnnouncement {
  id: string
  title: string
  content: string
  attachedFiles?: Array<{ name: string; size: string }>
  createdAt: string
  teacherName: string
  pinned?: boolean
}

export interface CourseExamSchedule {
  scheduleId: string
  examId: string
  title: string
  totalPoints: number
  startTime: string
  endTime: string
  status: string
}

export interface TeacherCourseDetail {
  course: CourseOffering
  materials: CourseMaterial[]
  students: StudentEnrollment[]
  announcements: CourseAnnouncement[]
  exams: CourseExamSchedule[]
}

export interface ExcelImportRecord {
  studentCode: string
  fullName: string
  email: string
  isValid: boolean
  errorReason?: string
}

export interface ExcelImportPreview {
  totalRows: number
  validCount: number
  invalidCount: number
  records: ExcelImportRecord[]
}

export interface StudentScoreRecord {
  studentId: string
  studentCode: string
  fullName: string
  quizScores: number[]
  midtermScore: number | null
  finalScore: number | null
  averageScore: number | null
}
