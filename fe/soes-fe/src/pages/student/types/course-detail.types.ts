// ── Shared ────────────────────────────────────────────────

export interface Pagination {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

// ── Course Header ─────────────────────────────────────────

export interface CourseHeader {
  courseOfferingId: string
  subjectId: string
  subjectCode: string
  subjectName: string
  courseCode: string
  teacherName: string
}

// ── Timeline ──────────────────────────────────────────────

export interface PostTimelineItem {
  id: string
  courseOfferingId: string
  type: 'POST'
  title: string
  authorName: string
  publishedAt: string
  edited: boolean
  hasAttachment: boolean
}

export interface ExamTimelineItem {
  id: string
  courseOfferingId: string
  type: 'EXAM'
  title: string
  authorName: string
  publishedAt: string
  startTime: string
  endTime: string
  durationMinutes: number
}

export type TimelineItem = PostTimelineItem | ExamTimelineItem

export interface TimelineResponse {
  items: TimelineItem[]
  pagination: Pagination
}

// ── Post Detail ───────────────────────────────────────────

export interface PostAttachment {
  id: string
  fileName: string
  fileType: string
  fileSize: string
  downloadUrl: string
}

export interface PostDetail {
  id: string
  title: string
  content: string
  publishedAt: string
  updatedAt: string
  edited: boolean
  attachments: PostAttachment[]
}

// ── Exam Detail ───────────────────────────────────────────

export type ExamType = 'MIDTERM' | 'FINAL' | 'QUIZ'
export type StudentExamStatus = 'NOT_STARTED' | 'AVAILABLE' | 'SUBMITTED' | 'EXPIRED'

export interface ExamDetail {
  id: string
  title: string
  type: ExamType
  description: string
  startTime: string
  endTime: string
  publishedAt: string
  durationMinutes: number
  maxAttempts: number
  attemptUsed: number
  remainingAttempts: number
  attemptId: string | null
  canResume: boolean
  canStart: boolean
  status: StudentExamStatus
  remainingSeconds: number | null
}

// ── Members ───────────────────────────────────────────────

export type MemberRole = 'TEACHER' | 'STUDENT'

export interface Member {
  memberId: string
  role: MemberRole
  fullName: string
  studentCode: string | null
}

export interface MembersResponse {
  items: Member[]
  pagination: Pagination
}

// ── Scores ────────────────────────────────────────────────

export interface ScoreItem {
  examId: string
  title: string
  type: ExamType
  score: number
  publishedAt: string
}

export interface ScoresResponse {
  items: ScoreItem[]
}
