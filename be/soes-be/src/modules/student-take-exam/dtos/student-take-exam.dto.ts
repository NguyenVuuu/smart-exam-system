export interface StartExamResponseDto {
  attemptId: string
  startedAt: string
  attemptEndAt: string
  remainingSeconds: number
}

// ─── API 2: Get Exam Content ──────────────────────────────────────────────────

export interface QuestionOptionDto {
  id:      string
  content: string
}

export interface ExamContentQuestionDto {
  id:         string
  orderIndex: number
  content:    string
  type:       string
  points:     number
  options:    QuestionOptionDto[]
}

export interface GetExamContentResponseDto {
  attemptId:        string
  title:            string
  durationMinutes:  number
  remainingSeconds: number
  questions:        ExamContentQuestionDto[]
}
