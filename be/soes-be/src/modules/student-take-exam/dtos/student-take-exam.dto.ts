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

// Choice questions (SINGLE_CHOICE | MULTIPLE_CHOICE)
export interface ExamContentChoiceQuestionDto {
  id:         string
  orderIndex: number
  content:    string
  type:       'SINGLE_CHOICE' | 'MULTIPLE_CHOICE'
  points:     number
  options:    QuestionOptionDto[]
  answer:     string[]   // selectedOptionIds; [] if unanswered
}

// Programming questions
export interface ExamContentProgrammingQuestionDto {
  id:              string
  orderIndex:      number
  content:         string
  type:            'PROGRAMMING'
  points:          number
  draftSourceCode: string | null  // null if unanswered
}

export type ExamContentQuestionDto =
  | ExamContentChoiceQuestionDto
  | ExamContentProgrammingQuestionDto

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
