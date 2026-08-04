// ==================
// Timeline Type
// ==================

export enum CourseDetailTimelineType {
  POST = 'POST',
  EXAM = 'EXAM',
}

// ==================
// Exam Availability Status
// ==================

export enum ExamAvailabilityStatus {
  NOT_STARTED = 'NOT_STARTED',
  AVAILABLE = 'AVAILABLE',
  SUBMITTED = 'SUBMITTED',
  EXPIRED = 'EXPIRED',
}

// ==================
// Member Role
// ==================

export enum MemberRole {
  TEACHER = 'TEACHER',
  ASSISTANT = 'ASSISTANT',
  STUDENT = 'STUDENT',
}

// ==================
// Common Types
// ==================

export interface PaginationDto {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface AttachmentDto {
  id: string
  fileName: string
  fileType: string
  fileSize: string
  downloadUrl: string
}
