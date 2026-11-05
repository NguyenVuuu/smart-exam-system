import type { Difficulty, QuestionType } from './teacher-questions.types'

export interface AiMaterial { id: string; title: string | null; fileName: string; courseCode: string; duplicated: boolean }
export interface AiSourceFile { fileName: string; storagePath: string; fileSize: number; contentType: string; checksum: string }
export interface GeneratedQuestion {
  id: string; title: string; content: string; explanation: string; type: QuestionType; difficulty: Difficulty; difficultyReason: string
  language: 'JAVA' | 'C' | 'CPP' | null; options: { content: string; isCorrect: boolean }[]
  timeLimitMs: number; memoryLimitMb: number; maxCodeSizeKb: number
  testCases: { input: string; expectedOutput: string; isHidden: boolean }[]
  status: 'PENDING_REVIEW'; subjectId: string; subjectName: string; sourceMaterialName: string
}
export interface AiGenerationResult { historyId: string; questions: GeneratedQuestion[] }
export interface GenerateAiPayload {
  subjectId: string; sourceType: 'COURSE_MATERIAL' | 'UPLOAD_FILE'; mode: 'GENERATE_FROM_MATERIAL' | 'EXTRACT_EXISTING_EXAM'
  materialIds: string[]; sourceFiles: AiSourceFile[]; prompt: string; questionCount?: number
  difficulty: 'AUTO' | Difficulty; targetQuestionType: 'MULTIPLE_CHOICE'
}
