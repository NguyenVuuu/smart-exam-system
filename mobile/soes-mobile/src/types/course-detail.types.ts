export interface Pagination {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface CourseHeader {
  courseOfferingId: string
  subjectId: string
  subjectCode: string
  subjectName: string
  courseCode: string
  teacherName: string
}

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

export type ExamType = 'MIDTERM' | 'FINAL' | 'QUIZ'
export type StudentExamStatus = 'NOT_STARTED' | 'AVAILABLE' | 'SUBMITTED' | 'EXPIRED'

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

export interface ScoreItem {
  examId: string
  attemptId: string
  title: string
  type: ExamType
  score: number
  publishedAt: string
}

export interface ScoresResponse {
  items: ScoreItem[]
}

export interface CourseMaterial {
  id: string
  title: string | null
  fileName: string
  fileType: string
  fileSize: string
  contentType: string
  uploadedAt: string
}

export interface MaterialsResponse {
  items: CourseMaterial[]
}
