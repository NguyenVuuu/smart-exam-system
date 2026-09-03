import type { TeacherExamDetailDto } from './teacher-exam-api.types'

export interface GeneratedExamDraft {
  id: string
  easyCount: number
  mediumCount: number
  hardCount: number
  totalPoints: number
  questionPoints: number[]
  questionIds: string[]
  exam: TeacherExamDetailDto
}

export type AutoExamPickMode = 'AUTO' | 'MANUAL'
export type AutoExamDraftStatus = 'NOT_GENERATED' | 'SAVED_DRAFT'
