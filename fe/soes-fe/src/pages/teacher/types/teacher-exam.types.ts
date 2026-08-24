import type { Question } from './teacher-question-bank.types'

export type ExamStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED'
export type ExamStudentVisibility = 'VISIBLE' | 'HIDDEN'
export type ExamType = 'MULTIPLE_CHOICE' | 'PROGRAMMING' | 'MIXED'
export type ExamCategory = 'QUIZ' | 'MIDTERM' | 'FINAL'
export type CreationMethod = 'MANUAL' | 'QUESTION_BANK' | 'AI_GENERATED' | 'MIXED'
export type ResultReleaseMode = 'IMMEDIATE' | 'MANUAL' | 'SCHEDULED'
export type ExamSectionType = 'OBJECTIVE' | 'PROGRAMMING'
export type ExamIpMode = 'HOME' | 'CAMPUS'
export type ExamVariantDistributionMode = 'RANDOM_ONLINE' | 'PAPER_PRINT'

export interface ExamQuestionItem {
  questionId: string
  question: Question
  points: number
  order: number
  sectionId?: string
}

export interface ExamSection {
  id: string
  title: string
  type: ExamSectionType
  description?: string
  targetPoints?: number
  order: number
}

export interface ExamAssignment {
  id: string
  courseOfferingId: string
  courseCode: string
  subjectName: string
  startTime: string
  endTime: string
  durationMinutes: number
  maxAttempts?: number
  password?: string
  resultReleaseMode?: ResultReleaseMode
  resultReleaseAt?: string
  allowStudentReview?: boolean
  requireFullscreen?: boolean
  enableWebcam?: boolean
  blockCopyPaste?: boolean
  blockRightClick?: boolean
  ipMode?: ExamIpMode
  allowedIpRange?: string
  distributionMode?: ExamVariantDistributionMode
  status: 'DRAFT' | 'SCHEDULED' | 'OPEN' | 'CLOSED'
}

export interface ExamVariant {
  id: string
  code: string
  status: 'DRAFT' | 'READY' | 'PUBLISHED'
  questionItems: ExamQuestionItem[]
  shuffleSeed: string
  assignedStudentCount?: number
  createdAt: string
}

export interface Exam {
  id: string
  courseOfferingId: string
  courseCode: string
  subjectName: string
  title: string
  description: string
  category?: ExamCategory
  type: ExamType
  creationMethod: CreationMethod
  status: ExamStatus
  studentVisibility: ExamStudentVisibility
  startTime: string
  endTime: string
  durationMinutes: number
  maxAttempts: number
  password?: string
  shuffleQuestions: boolean
  shuffleOptions: boolean
  resultReleaseMode?: ResultReleaseMode
  resultReleaseAt?: string
  resultPublished: boolean
  sections?: ExamSection[]
  assignments?: ExamAssignment[]
  questions: ExamQuestionItem[]
  variants?: ExamVariant[]
  totalPoints: number
  createdAt: string
}

export interface StudentCodingSubmissionResult {
  testCaseId: string
  passed: boolean
  input: string
  expectedOutput: string
  actualOutput: string
  executionTimeMs: number
  memoryKb: number
}

export interface ExamSubmission {
  id: string
  examId: string
  studentId: string
  studentCode: string
  studentName: string
  submittedAt: string
  autoScore: number
  manualScoreOverride?: number
  finalScore: number
  status: 'SUBMITTED' | 'GRADING' | 'GRADED'
  codingResults?: StudentCodingSubmissionResult[]
}

export interface ViolationRecord {
  id: string
  examId: string
  studentId: string
  studentCode: string
  studentName: string
  type: 'TAB_SWITCH' | 'FULLSCREEN_EXIT' | 'NO_FACE' | 'MULTIPLE_FACES' | 'INACTIVITY'
  timestamp: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  evidenceImageUrl?: string
  note?: string
}
