export type AdminStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'LOCKED'

export interface AcademicYear {
  id: string
  code: string
  name: string
  academicYear: string
  term: 1 | 2 | 3
  startDate: string
  endDate: string
  status: 'UPCOMING' | 'ACTIVE' | 'CLOSED'
  isCurrent?: boolean
}

export interface Department {
  id: string
  code?: string
  name: string
  headUserId?: string
  headName?: string
  headCode?: string
  subjectCount: number
}

export interface AdminSubject {
  id: string
  code: string
  name: string
  departmentId: string
  credits: number
  courseCount: number
  status: 'ACTIVE' | 'INACTIVE'
}

export interface CourseOfferingAdmin {
  id: string
  subjectId?: string
  semesterId?: string
  teacherId?: string
  code: string
  subjectCode: string
  subjectName: string
  semesterCode: string
  teacherName: string
  enrolled: number
  capacity: number
  status: 'OPEN' | 'CLOSED'
}

export interface AdminUser {
  id: string
  profileId?: string
  code: string
  fullName: string
  email: string
  phone?: string
  role: 'ADMIN' | 'TEACHER' | 'STUDENT'
  departmentName?: string
  departmentId?: string
  position?: 'LECTURER' | 'DEPARTMENT_HEAD'
  status: 'ACTIVE' | 'LOCKED'
}

export interface SharedQuestionAdmin {
  id: string
  title: string
  content: string
  explanation?: string
  subjectId?: string
  departmentId?: string
  subjectCode: string
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'PROGRAMMING'
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  contributorName: string
  reviewedBy?: string
  reviewedAt?: string
  status: 'APPROVED' | 'REMOVED'
  removedBy?: string
  removedAt?: string
  removalReason?: string
  options?: Array<{ id: string; content: string; isCorrect: boolean }>
  programmingConfig?: { timeLimitMs: number; memoryLimitMb: number; maxCodeSizeKb: number }
  testCases?: Array<{ id: string; input: string; expectedOutput: string; isHidden: boolean }>
}

export interface CourseEnrollmentAdmin {
  id: string
  code: string
  fullName: string
  email: string
  enrolledAt: string
}

export interface AdminExam {
  id: string
  title: string
  semesterCode: string
  departmentId: string
  subjectCode: string
  subjectName: string
  authorName: string
  category: 'QUIZ' | 'MIDTERM' | 'FINAL'
  structure: 'OBJECTIVE' | 'PROGRAMMING' | 'MIXED'
  totalPoints: number
  questionCount: number
  durationMinutes: number
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'LOCKED' | 'ARCHIVED'
}

export interface AdminExamSchedule {
  id: string
  examId?: string
  examTitle: string
  subjectName: string
  courseCodes: string[]
  date: string
  time: string
  location: string
  ipPolicy: string
  password?: string
  hasPassword?: boolean
  distributionMode: string
  releaseMode: string
  resultReleaseAt?: string
  allowStudentReview?: boolean
  requireFullscreen?: boolean
  enableWebcam?: boolean
  blockCopyPaste?: boolean
  blockRightClick?: boolean
  proctors: string[]
  proctorAssignments?: Array<{
    courseOfferingId: string
    courseCode: string
    teacherId: string
    teacherName: string
  }>
  status: 'DRAFT' | 'SCHEDULED' | 'OPEN' | 'CLOSED' | 'CANCELLED'
}

export interface AdminProctorSession {
  id: string
  scheduleName: string
  courseCode: string
  online: number
  inProgress: number
  submitted: number
  disconnected: number
  warnings: number
  status: 'OPEN' | 'CLOSED'
}

export interface AuditLogItem {
  id: string
  time: string
  actor: string
  action: string
  entity: string
  detail: string
}
