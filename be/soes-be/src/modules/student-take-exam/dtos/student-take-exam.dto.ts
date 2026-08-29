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
  language:        string
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
  integritySettings: ExamIntegritySettingsDto
  questions:        ExamContentQuestionDto[]
}

export interface ExamIntegritySettingsDto {
  enableWebcam: boolean
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
  attemptEndAt:       string
  submittedAt:        string | null
  endedBy:            string | null
  remainingSeconds:   number
  lastSavedAt:        string | null
  isOnline:           boolean
  answeredCount:      number
  totalQuestionCount: number
}


// ─── API 6: Send Heartbeat ─────────────────────────────────────────────────────

export interface SendHeartbeatResponseDto {
  remainingSeconds: number
  isOnline: boolean
}

// ─── API 7: Run Code ───────────────────────────────────────────────────────────

export interface RunCodeTestCaseDtoBase {
  testCaseId: string
  isSample: boolean
  status: 'PASSED' | 'WRONG_ANSWER' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED' | 'SYSTEM_ERROR'
}

export interface RunCodeSampleTestCaseDto extends RunCodeTestCaseDtoBase {
  isSample: true
  input: string
  expectedOutput: string
  actualOutput: string | null
  executionTimeMs: number
  memoryUsedKb: number
}

export interface RunCodeHiddenTestCaseDto extends RunCodeTestCaseDtoBase {
  isSample: false
}

export type RunCodeTestCaseDto = RunCodeSampleTestCaseDto | RunCodeHiddenTestCaseDto

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
  testCases: RunCodeTestCaseDto[]
}
