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
  attemptEndAt:     string
  questions:        ExamContentQuestionDto[]
}

// ─── API 3: Save Answer ───────────────────────────────────────────────────────

export interface SaveAnswerResponseDto {
  questionId:       string
  remainingSeconds: number
}

// ─── API 4: Submit Exam ───────────────────────────────────────────────────────

export interface SubmitExamResponseDto {
  attemptId:   string
  submittedAt: string
}

// ─── API 5: Get Attempt Status ────────────────────────────────────────────────

export interface GetAttemptStatusResponseDto {
  attemptId:          string
  status:             string
  startedAt:          string
  attemptEndAt:       string
  submittedAt:        string | null
  endedBy:            string | null
  remainingSeconds:   number
  lastSavedAt:        string | null
  isOnline:           boolean
  answeredCount:      number
  totalQuestionCount: number
}
