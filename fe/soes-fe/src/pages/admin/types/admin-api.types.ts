export interface ApiResponse<T> { success: boolean; data: T }
export interface ApiPagination { page: number; pageSize: number; totalItems: number; totalPages: number }
export interface ApiPage<T> { items: T[]; pagination: ApiPagination }

export interface DepartmentApiDto {
  id: string; code: string; name: string; description: string | null; status: string
  subjectCount: number; teacherCount: number
  head: { id: string; code: string; fullName: string } | null
}

export interface SubjectApiDto {
  id: string; code: string; name: string; credits: number; status: string
  department: { id: string; code: string; name: string }
  courseOfferingCount: number
}

export interface SemesterApiDto {
  id: string; code: string; name: string; academicYear: string
  term: 'TERM_1' | 'TERM_2' | 'TERM_3'; startDate: string; endDate: string
  status: 'UPCOMING' | 'ACTIVE' | 'CLOSED'; courseOfferingCount: number
}

export interface SemesterPayload {
  academicYear: string
  term: 'TERM_1' | 'TERM_2' | 'TERM_3'
  startDate: string
  endDate: string
}

export interface CourseOfferingApiDto {
  id: string; code: string; status: string; maxCapacity: number; enrollmentCount: number
  semester: { id: string; code: string; name: string }
  subject: { id: string; code: string; name: string; departmentId: string }
  teacher: { id: string; code: string; fullName: string }
  scheduleCount: number
}

export interface UserApiDto {
  id: string; profileId: string; code: string; fullName: string; role: 'ADMIN' | 'TEACHER' | 'STUDENT'
  email: string | null; phoneNumber: string | null; status: string; position: string | null
  department: { id: string; code: string; name: string } | null
}

export interface DepartmentPayload {
  code: string; name: string; description?: string | null; status: 'ACTIVE' | 'INACTIVE'
}

export interface SubjectPayload {
  code: string; name: string; credits: number; departmentId: string
  description?: string | null; status: 'ACTIVE' | 'INACTIVE'
}

export interface CourseOfferingPayload {
  code: string; semesterId: string; subjectId: string; teacherId: string
  maxCapacity: number; status: 'ACTIVE' | 'CLOSED'
}

export interface UserPayload {
  role: UserApiDto['role']; code: string; fullName: string; email?: string | null
  phoneNumber?: string | null; departmentId?: string | null
  status: 'ACTIVE' | 'INACTIVE'; password?: string
}

export type UpdateUserPayload = Omit<UserPayload, 'password'>

export interface ReadyFinalExamApiDto {
  id: string; title: string; totalPoints: string | number; defaultDurationMinutes: number; format: string
  createdBy: { user: { fullName: string } }
  subject: { id: string; code: string; name: string; departmentId: string }
  _count: { examQuestions: number }
}

export interface ExamScheduleApiDto {
  id: string; title: string; startTime: string; endTime: string; durationMinutes: number
  maxAttempts: number; status: string; locationMode: string; allowedIpRanges: string[]
  distributionMode: string; resultReleaseMode: string; resultReleaseAt: string | null
  reviewPolicy: string; hasPassword: boolean; requireFullscreen: boolean; enableWebcam: boolean
  blockCopyPaste: boolean; blockRightClick: boolean
  exam: { id: string; title: string; subject: { id: string; code: string; name: string; departmentId: string } }
  courses: Array<{ id: string; code: string; proctors: Array<{ id: string; code: string; fullName: string }> }>
}

export interface SchedulePayload {
  title: string; examId: string; startTime: string; endTime: string
  durationMinutes: number; maxAttempts: number; password?: string | null
  enableTabLock: boolean; maxTabSwitches: number | null; requireFullscreen: boolean
  enableWebcam: boolean; blockCopyPaste: boolean; blockRightClick: boolean
  locationMode: 'ONLINE' | 'CAMPUS'; allowedIpRanges: string[]
  distributionMode: string; randomQuestionCount: number | null
  resultReleaseMode: string; resultReleaseAt: string | null
  reviewPolicy: string; reviewStartAt: string | null; reviewEndAt: string | null
  status: 'DRAFT' | 'SCHEDULED'
  courses: Array<{ courseOfferingId: string; teacherIds: string[] }>
}

export interface AdminQuestionBankApiDto {
  id: string; content: string; explanation: string | null; type: SharedQuestionType; difficulty: QuestionDifficulty
  subject: { id: string; code: string; name: string; departmentId: string }
  contributor: { id: string; fullName: string }; reviewer: { id: string; fullName: string } | null
  status: 'APPROVED' | 'REMOVED'; reviewedAt: string | null
  removedAt: string | null; removedBy: string | null; removalReason: string | null
  options: Array<{ id: string; content: string; isCorrect: boolean }>
  programmingConfig: { timeLimitMs: number; memoryLimitMb: number; maxCodeSizeKb: number } | null
  testCases: Array<{ id: string; input: string; expectedOutput: string; weight: number; isHidden: boolean }>
}

type SharedQuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'PROGRAMMING'
type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD'

export interface AdminExamTrackingApiDto {
  id: string; title: string; description: string | null; type: 'QUIZ' | 'MIDTERM' | 'FINAL'
  format: 'OBJECTIVE' | 'PROGRAMMING' | 'MIXED'; status: string; approvalStatus: string
  totalPoints: number; durationMinutes: number
  subject: { id: string; code: string; name: string; departmentId: string }
  creator: { id: string; fullName: string }; reviewer: { id: string; fullName: string } | null
  questionCount: number; scheduleCount: number; createdAt: string; updatedAt: string
}
