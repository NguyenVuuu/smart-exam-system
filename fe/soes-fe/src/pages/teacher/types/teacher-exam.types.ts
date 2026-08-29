import type { Question } from './teacher-question-bank.types'
import type { TeacherExamCapabilities } from './teacher-exam-api.types'

export type ExamStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'REJECTED'
  | 'PUBLISHED'
  | 'LOCKED'
  | 'ARCHIVED'
export type ExamStudentVisibility = 'VISIBLE' | 'HIDDEN'
export type ExamType = 'MULTIPLE_CHOICE' | 'PROGRAMMING' | 'MIXED'
export type ExamCategory = 'QUIZ' | 'MIDTERM' | 'FINAL'
export type CreationMethod = 'MANUAL' | 'QUESTION_BANK' | 'AI_GENERATED' | 'MIXED'
export type ResultReleaseMode = 'IMMEDIATE' | 'MANUAL' | 'SCHEDULED'
export type ExamSectionType = 'OBJECTIVE' | 'PROGRAMMING'
export type ExamIpMode = 'HOME' | 'CAMPUS'
export type ExamDistributionMode =
  | 'FIXED_ORDER'
  | 'SHUFFLE_ORDER'
  | 'SHUFFLE_OPTIONS'
  | 'SHUFFLE_QUESTIONS_AND_OPTIONS'
  | 'RANDOM_SUBSET'

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

export interface ExamSchedule {
  id: string
  examId: string
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
  distributionMode?: ExamDistributionMode
  resultsPublished?: boolean
  proctorIds?: string[]
  status: 'DRAFT' | 'SCHEDULED' | 'OPEN' | 'CLOSED' | 'CANCELLED'
}

export interface Exam {
  id: string
  authorId: string
  authorName: string
  subjectId: string
  subjectCode: string
  subjectName: string
  title: string
  description: string
  category?: ExamCategory
  type: ExamType
  creationMethod: CreationMethod
  status: ExamStatus
  studentVisibility: ExamStudentVisibility
  defaultDurationMinutes: number
  sections?: ExamSection[]
  schedules?: ExamSchedule[]
  questions: ExamQuestionItem[]
  questionCount?: number
  scheduleCount?: number
  capabilities?: TeacherExamCapabilities
  totalPoints: number
  createdAt: string
  rejectionReason?: string
  lockedReason?: string
}

export interface StudentCodingSubmissionResult {
  questionId: string
  testCaseId: string
  passed: boolean
  input: string
  expectedOutput: string
  actualOutput: string
  executionTimeMs: number
  memoryKb: number
}

export interface GradeAdjustment {
  id: string
  oldScore: number
  newScore: number
  reason: string
  adjustedBy: string
  adjustedAt: string
}

export interface RegradeRequest {
  status: 'SUBMITTED' | 'IN_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'CLOSED'
  reason: string
  submittedAt: string
  resolution?: string
  resolvedAt?: string
}

export interface ExamSubmission {
  id: string
  examId: string
  scheduleId: string
  attemptId: string
  studentId: string
  studentCode: string
  studentName: string
  submittedAt: string
  autoScore: number
  manualScoreOverride?: number
  overrideReason?: string
  scoreAdjustments?: GradeAdjustment[]
  regradeRequest?: RegradeRequest
  finalScore: number
  status: 'SUBMITTED' | 'GRADING' | 'GRADED' | 'INVALIDATED'
  codingResults?: StudentCodingSubmissionResult[]
  answers?: Array<{
    questionId: string
    selectedOptionIds?: string[]
    sourceCode?: string
    programmingLanguage?: 'JAVA' | 'C' | 'CPP'
  }>
}

export interface ViolationRecord {
  id: string
  scheduleId: string
  attemptId: string
  studentId: string
  studentCode: string
  studentName: string
  type:
    | 'TAB_SWITCH'
    | 'FULLSCREEN_EXIT'
    | 'COPY_PASTE'
    | 'NO_FACE'
    | 'MULTIPLE_FACES'
    | 'CAMERA_BLOCKED'
    | 'IP_CHANGED'
    | 'HEARTBEAT_MISSED'
    | 'MULTIPLE_ACTIVE_SESSIONS'
    | 'INACTIVITY'
  timestamp: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  evidenceImageUrl?: string
  note?: string
}
