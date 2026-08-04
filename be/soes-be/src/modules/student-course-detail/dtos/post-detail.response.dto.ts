import type { AttachmentDto } from '../types/student-course-detail.types'

export interface PostDetailResponseDto {
  id: string
  title: string
  content: string
  publishedAt: Date
  updatedAt: Date
  edited: boolean
  attachments: AttachmentDto[]
}
