export interface StartExamResponseDto {
  attemptId: string
  startedAt: string
  deadlineAt: string
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
  language:        string
  programmingConfig: {
    timeLimitMs: number
    memoryLimitMb: number
    maxCodeSizeKb: number
  }
}

export type ExamContentQuestionDto =
  | ExamContentChoiceQuestionDto
  | ExamContentProgrammingQuestionDto

export interface GetExamContentResponseDto {
  attemptId:        string
  title:            string
  durationMinutes:  number
  remainingSeconds: number
  deadlineAt:      string
  integritySettings: ExamIntegritySettingsDto
  questions:        ExamContentQuestionDto[]
}

export interface ExamIntegritySettingsDto {
  enableWebcam: boolean
  requireFullscreen: boolean
  blockCopyPaste: boolean
  blockRightClick: boolean
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
  deadlineAt:         string
  submittedAt:        string | null
  endedBy:            string | null
  remainingSeconds:   number
  lastSavedAt:        string | null
  isOnline:           boolean
  answeredCount:      number
  totalQuestionCount: number
}

export interface GetAttemptResultResponseDto {
  available: boolean
  releaseMode: string
  releaseAt: string | null
  score: number | null
  maxScore: number | null
  reviewPolicy: string | null
  reason: 'AVAILABLE' | 'GRADING' | 'PENDING_RELEASE' | 'NEVER'
  reviewItems: AttemptReviewItemDto[]
}

export interface AttemptReviewOptionDto {
  id: string
  content: string
  isCorrect?: boolean
}

export interface AttemptReviewItemDto {
  questionId: string
  orderIndex: number
  type: string
  content: string
  points: number
  score: number | null
  isCorrect: boolean | null
  selectedOptionIds?: string[]
  draftSourceCode?: string | null
  options?: AttemptReviewOptionDto[]
  correctOptionIds?: string[]
  explanation?: string | null
}


// ─── API 6: Send Heartbeat ─────────────────────────────────────────────────────

export interface SendHeartbeatResponseDto {
  remainingSeconds: number
  isOnline: boolean
}

export interface RecordViolationResponseDto {
  id: string
  violationType: string
  severity: string
  detectedAt: string
  evidenceUrls: string[]
}

// ─── API 7: Run Code ───────────────────────────────────────────────────────────

type RunCodeTestCaseStatusDto =
  | 'PASSED'
  | 'WRONG_ANSWER'
  | 'RUNTIME_ERROR'
  | 'TIME_LIMIT_EXCEEDED'
  | 'MEMORY_LIMIT_EXCEEDED'
  | 'SYSTEM_ERROR'

interface RunCodeTestCaseBaseDto {
  testCaseId: string
  isSample: boolean
  status: RunCodeTestCaseStatusDto
}

export interface RunCodeSampleTestCaseDto extends RunCodeTestCaseBaseDto {
  isSample: true
  input: string
  expectedOutput: string
  actualOutput: string | null
  executionTimeMs: number
  memoryUsedKb: number
}

export type RunCodeTestCaseDto = RunCodeSampleTestCaseDto

export interface RunCodeResponseDto {
  questionId: string
  remainingSeconds: number
  isOnline: boolean
  compilationStatus: 'COMPILED' | 'COMPILE_ERROR'
  compilerOutput: string | null
  runtimeError: string | null
  hasSystemError: boolean 
  summary: {
    passedCount: number
    totalCount: number
    message: string
  }
  hiddenTestCaseCount: number
  testCases: RunCodeTestCaseDto[]
}
