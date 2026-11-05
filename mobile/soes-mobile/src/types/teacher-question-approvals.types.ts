import type { TeacherQuestion } from './teacher-questions.types'

export interface QuestionApproval { id: string; question: TeacherQuestion }
export interface QuestionApprovalPage { items: QuestionApproval[]; pagination: { page: number; totalPages: number; totalItems: number } }
