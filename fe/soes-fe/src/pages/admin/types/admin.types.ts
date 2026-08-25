export type AdminStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'LOCKED'

export interface AcademicYear {
  id: string
  code: string
  name: string
  academicYear: string
  term: 1 | 2 | 3
  startDate: string
  endDate: string
  status: 'ACTIVE' | 'CLOSED' | 'ARCHIVED'
  isCurrent?: boolean
}

export interface Department {
  id: string
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
  code: string
  fullName: string
  email: string
  phone?: string
  role: 'ADMIN' | 'TEACHER' | 'STUDENT'
  departmentName?: string
  position?: 'LECTURER' | 'DEPARTMENT_HEAD'
  status: 'ACTIVE' | 'LOCKED'
}

export interface SharedQuestionAdmin {
  id: string
  content: string
  subjectCode: string
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'PROGRAMMING'
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  contributorName: string
  reviewedBy: string
  status: 'APPROVED' | 'REMOVED'
}

export interface AdminExam {
  id: string
  title: string
  subjectName: string
  authorName: string
  category: 'QUIZ' | 'MIDTERM' | 'FINAL'
  structure: 'OBJECTIVE' | 'PROGRAMMING' | 'MIXED'
  totalPoints: number
  questionCount: number
  durationMinutes: number
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'LOCKED'
}

export interface AdminExamSchedule {
  id: string
  examTitle: string
  courseCodes: string[]
  date: string
  time: string
  location: string
  ipPolicy: string
  proctors: string[]
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
