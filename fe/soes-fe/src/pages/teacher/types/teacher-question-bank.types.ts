export type QuestionType =
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'PROGRAMMING'
export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD'
export type AIDraftStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'
export type QuestionBankScope = 'PERSONAL' | 'SHARED'

export interface QuestionOption {
  id: string
  content: string
  isCorrect: boolean
}

export interface TestCase {
  id: string
  input: string
  expectedOutput: string
  weight: number
  isHidden: boolean
}

export interface Question {
  id: string
  subjectId: string
  subjectName: string
  teacherId: string
  teacherName: string
  bankScope?: QuestionBankScope
  reviewStatus?: 'PRIVATE' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'
  rejectionReason?: string
  type: QuestionType
  difficulty: DifficultyLevel
  content: string
  explanation?: string
  options?: QuestionOption[]
  programmingLanguage?: 'JAVA' | 'C' | 'CPP'
  timeLimitMs?: number
  memoryLimitMb?: number
  testCases?: TestCase[]
  createdAt: string
  archivedAt?: string
}

export interface AIDraftQuestion extends Question {
  status: AIDraftStatus
  aiConfidence?: number
  sourceMaterialName: string
}

export interface AIGenerationHistoryItem {
  id: string
  courseOfferingId: string
  courseCode: string
  teacherName: string
  generatedAt: string
  prompt: string
  aiModel: string
  materialsUsed: string[]
  questionCount: number
  approvedCount: number
  status: 'COMPLETED' | 'FAILED'
}
