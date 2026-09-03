import type { DifficultyLevel, QuestionType } from './teacher-question-bank.types'

export interface TeacherQuestionDto {
  id: string
  title: string
  content: string
  explanation: string | null
  type: QuestionType
  difficulty: DifficultyLevel
  aiDifficultyReason: string | null
  language: 'JAVA' | 'C' | 'CPP' | null
  subject: { id: string; code: string; name: string }
  owner: { id: string; fullName: string }
  options: Array<{ id: string; content: string; isCorrect: boolean }>
  programmingConfig: { timeLimitMs: number; memoryLimitMb: number; maxCodeSizeKb: number } | null
  testCases: Array<{ id: string; input: string; expectedOutput: string; isHidden: boolean }>
  sharedBank: {
    itemId: string
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
    rejectionReason: string | null
    removedAt: string | null
    removalReason: string | null
    removedByName: string | null
  } | null
  createdAt: string
  archivedAt: string | null
}

export interface QuestionPayload {
  subjectId: string
  title: string
  content: string
  explanation?: string | null
  type: QuestionType
  difficulty: DifficultyLevel
  language?: 'JAVA' | 'C' | 'CPP' | null
  options: Array<{ content: string; isCorrect: boolean }>
  timeLimitMs?: number
  memoryLimitMb?: number
  maxCodeSizeKb?: number
  testCases: Array<{ input: string; expectedOutput: string; isHidden: boolean }>
}

export interface TeacherSubjectOption {
  id: string
  name: string
}

export interface AiSourceFileDto {
  fileName: string
  storagePath: string
  fileSize: number
  contentType: string
  checksum: string
}

export interface AiMaterialDto {
  id: string
  title: string | null
  fileName: string
  fileSize: number
  contentType: string
  checksum: string | null
  courseOfferingId: string
  courseCode: string
  duplicated: boolean
}

export interface GeneratedQuestionDto {
  id: string
  title: string
  content: string
  explanation: string
  type: QuestionType
  difficulty: DifficultyLevel
  difficultyReason: string
  language: 'JAVA' | 'C' | 'CPP' | null
  options: Array<{ content: string; isCorrect: boolean }>
  timeLimitMs: number
  memoryLimitMb: number
  maxCodeSizeKb: number
  testCases: Array<{ input: string; expectedOutput: string; isHidden: boolean }>
  status: 'PENDING_REVIEW'
  subjectId: string
  subjectName: string
  sourceMaterialName: string
}

export interface AiGenerationHistoryDto {
  id: string
  subject: { id: string; code: string; name: string }
  courseOffering: { id: string; code: string } | null
  prompt: string
  aiModel: string
  mode: 'GENERATE_FROM_MATERIAL' | 'EXTRACT_EXISTING_EXAM'
  sourceType: 'COURSE_MATERIAL' | 'UPLOAD_FILE'
  sourceNames: string[]
  questionCount: number
  approvedCount: number
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  errorMessage: string | null
  createdAt: string
  completedAt: string | null
}
