import type { CourseDetailTimelineType, PaginationDto } from '../types/student-course-detail.types'

export interface TimelineItemDto {
  id: string
  type: CourseDetailTimelineType
  title: string
  publishedAt: Date
  edited: boolean
  startTime?: Date
  endTime?: Date
}

export interface TimelineResponseDto {
  items: TimelineItemDto[]
  pagination: PaginationDto
}
