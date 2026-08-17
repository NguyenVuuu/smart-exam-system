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
