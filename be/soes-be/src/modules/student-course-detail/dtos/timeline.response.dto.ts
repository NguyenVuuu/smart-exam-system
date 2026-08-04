import type { CourseDetailTimelineType, PaginationDto } from '../types/student-course-detail.types'

export interface PostTimelineItemDto {
  id: string
  courseOfferingId: string
  type: 'POST'
  title: string
  authorName: string
  publishedAt: Date
  edited: boolean
  hasAttachment: boolean
}

export interface ExamTimelineItemDto {
  id: string
  courseOfferingId: string
  type: 'EXAM'
  title: string
  authorName: string
  publishedAt: Date
  startTime: Date
  endTime: Date
  durationMinutes: number
}

export type TimelineItemDto = PostTimelineItemDto | ExamTimelineItemDto

export interface TimelineResponseDto {
  items: TimelineItemDto[]
  pagination: PaginationDto
}
