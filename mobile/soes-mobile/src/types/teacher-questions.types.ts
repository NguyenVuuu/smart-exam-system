export type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'PROGRAMMING'
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'
export interface TeacherQuestion {
  id: string; title: string; content: string; explanation: string | null
  type: QuestionType; difficulty: Difficulty; language: 'JAVA' | 'C' | 'CPP' | null
  subject: { id: string; code: string; name: string }
  options: { id: string; content: string; isCorrect: boolean }[]
  sharedBank: { itemId: string; status: 'PENDING' | 'APPROVED' | 'REJECTED'; rejectionReason: string | null; removedAt: string | null } | null
  createdAt: string; archivedAt: string | null
}
export interface QuestionPage { items: TeacherQuestion[]; pagination: { page: number; totalPages: number; totalItems: number } }
export interface QuestionSubject { id: string; name: string; code?: string }
export interface ObjectiveQuestionPayload {
  subjectId: string; title: string; content: string; explanation: string | null
  type: Exclude<QuestionType, 'PROGRAMMING'>; difficulty: Difficulty
  options: { content: string; isCorrect: boolean }[]; testCases: []
}
