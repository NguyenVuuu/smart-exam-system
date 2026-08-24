export interface GeneratedExamCode {
  code: string
  easyCount: number
  mediumCount: number
  hardCount: number
  totalPoints: number
  pointsPerQuestion: number
  questionIds: string[]
}

export type AutoExamPickMode = 'AUTO' | 'MANUAL'
export type AutoExamDraftStatus = 'NOT_GENERATED' | 'GENERATED' | 'SAVED_DRAFT'
