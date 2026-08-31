export interface ExamSubmissionDto {
  id: string
  examId: string
  scheduleId: string
  attemptId: string
  studentId: string
  studentCode: string
  studentName: string
  submittedAt: Date | null
  autoScore: number | null
  manualScoreOverride: number | null
  finalScore: number | null
  status: string
  sectionScores: Array<{ id: string; title: string; score: number; maxScore: number }>
  answers: Array<{
    questionId: string
    selectedOptionIds: string[]
    sourceCode: string | null
    score: number | null
  }>
  codingResults: Array<{
    questionId: string
    testCaseId: string
    passed: boolean
    input: string
    expectedOutput: string
    actualOutput: string | null
    executionTimeMs: number
    memoryKb: number
  }>
}
