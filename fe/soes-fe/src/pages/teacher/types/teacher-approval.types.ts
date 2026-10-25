import type { Exam } from './teacher-exam.types'
import type { Question } from './teacher-question-bank.types'

export type ApprovalKind = 'QUESTION' | 'EXAM'

export type ApprovalItem =
  | {
      kind: 'QUESTION'
      id: string
      title: string
      subjectName: string
      authorId: string
      authorName: string
      createdAt: string
      source: Question
    }
  | {
      kind: 'EXAM'
      id: string
      title: string
      subjectName: string
      authorId: string
      authorName: string
      createdAt: string
      version: number
      source: Exam
    }
