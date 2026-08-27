import type { SaveAnswerBody } from '../validators/student-take-exam.validator'

export interface StartExamResult {
  attemptId: string
  startedAt: Date
  attemptEndAt: Date
  remainingSeconds: number
}

// ─── API 2: Get Exam Content ──────────────────────────────────────────────────

export interface ExamContentResult {
  attemptId:        string
  title:            string
  durationMinutes:  number
  remainingSeconds: number
  attemptEndAt:     Date
  questions: Array<ExamContentQuestion>
}

export type ExamContentQuestion =
  | ExamContentChoiceQuestion
  | ExamContentProgrammingQuestion

interface ExamContentQuestionBase {
  id:         string
  orderIndex: number
  content:    string
  points:     number
}

export interface ExamContentChoiceQuestion extends ExamContentQuestionBase {
  type:    'SINGLE_CHOICE' | 'MULTIPLE_CHOICE'
  options: Array<{ id: string; content: string }>
  answer:  string[]   // selectedOptionIds — empty array if not yet answered
}

export interface ExamContentProgrammingQuestion extends ExamContentQuestionBase {
  type:            'PROGRAMMING'
  draftSourceCode: string | null   // null if not yet answered
  language:        string
}

// ─── API 3: Save Answer ───────────────────────────────────────────────────────

export interface SaveAnswerInput {
  examId:     string
  attemptId:  string
  studentId:  string
  questionId: string
  answer:     SaveAnswerBody['answer']
}

export interface SaveAnswerResult {
  questionId:       string
  remainingSeconds: number
}

// ─── API 4: Submit Exam ───────────────────────────────────────────────────────

export interface SubmitExamResult {
  attemptId:   string
  submittedAt: Date
}

// ─── API 5: Get Attempt Status ────────────────────────────────────────────────

export interface AttemptStatusResult {
  attemptId:          string
  status:             string
  startedAt:          Date
  attemptEndAt:       Date
  submittedAt:        Date | null
  endedBy:            string | null
  remainingSeconds:   number
  lastSavedAt:        Date | null
  isOnline:           boolean
  answeredCount:      number
  totalQuestionCount: number
}


// ─── API 6: Send Heartbeat ─────────────────────────────────────────────────────

export interface SendHeartbeatResult {
  remainingSeconds: number
  isOnline: boolean
}

// ─── API 7: Run Code ───────────────────────────────────────────────────────────

export interface RunCodeResult {
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
  testCases: RunCodeTestCase[]
}

export type RunCodeTestCase = RunCodeSampleTestCase | RunCodeHiddenTestCase

export interface RunCodeTestCaseBase {
  testCaseId: string
  isSample: boolean
  status: 'PASSED' | 'WRONG_ANSWER' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED' | 'SYSTEM_ERROR'
}

export interface RunCodeSampleTestCase extends RunCodeTestCaseBase {
  isSample: true
  input: string
  expectedOutput: string
  actualOutput: string | null
  executionTimeMs: number
  memoryUsedKb: number
}

export interface RunCodeHiddenTestCase extends RunCodeTestCaseBase {
  isSample: false
}