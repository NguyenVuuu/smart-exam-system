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
