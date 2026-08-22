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
  questions: Array<{
    id:         string
    orderIndex: number
    content:    string
    type:       string
    points:     number
    options: Array<{
      id:      string
      content: string
    }>
  }>
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
