import { create } from 'zustand'
import { MOCK_EXAMS } from '../mock/teacher-exam.mock'
import { MOCK_QUESTION_BANK } from '../mock/teacher-question-bank.mock'
import type { Exam, ExamSchedule, ExamStudentVisibility } from '../types/teacher-exam.types'
import type { Question } from '../types/teacher-question-bank.types'

interface TeacherWorkspaceState {
  exams: Exam[]
  questions: Question[]
  upsertExam: (exam: Exam) => void
  removeDraftExam: (examId: string) => void
  setExamVisibility: (examId: string, visibility: ExamStudentVisibility) => void
  replaceExamSchedules: (examId: string, schedules: ExamSchedule[]) => void
  upsertQuestion: (question: Question) => void
  addQuestions: (questions: Question[]) => void
  removeQuestion: (questionId: string) => void
  archiveQuestion: (questionId: string) => void
  restoreQuestion: (questionId: string) => void
  submitQuestionForReview: (questionId: string, autoApprove?: boolean) => void
  removeQuestionFromSharedBank: (questionId: string) => void
  reviewQuestion: (questionId: string, approved: boolean, reason?: string) => void
  reviewExam: (examId: string, approved: boolean, reason?: string) => void
}

export const useTeacherWorkspaceStore = create<TeacherWorkspaceState>((set) => ({
  exams: MOCK_EXAMS.map((exam) => ({ ...exam, questions: [...exam.questions], schedules: [...(exam.schedules ?? [])] })),
  questions: MOCK_QUESTION_BANK.map((question) => ({ ...question })),
  upsertExam: (exam) => set((state) => ({
    exams: state.exams.some((item) => item.id === exam.id)
      ? state.exams.map((item) => (item.id === exam.id ? exam : item))
      : [exam, ...state.exams],
  })),
  removeDraftExam: (examId) => set((state) => ({
    exams: state.exams.filter((exam) => exam.id !== examId || exam.status !== 'DRAFT'),
  })),
  setExamVisibility: (examId, studentVisibility) => set((state) => ({
    exams: state.exams.map((exam) => exam.id === examId ? { ...exam, studentVisibility } : exam),
  })),
  replaceExamSchedules: (examId, schedules) => set((state) => ({
    exams: state.exams.map((exam) => exam.id === examId ? { ...exam, schedules } : exam),
  })),
  upsertQuestion: (question) => set((state) => ({
    questions: state.questions.some((item) => item.id === question.id)
      ? state.questions.map((item) => item.id === question.id ? question : item)
      : [question, ...state.questions],
  })),
  addQuestions: (questions) => set((state) => ({ questions: [...questions, ...state.questions] })),
  removeQuestion: (questionId) => set((state) => ({
    questions: state.questions.filter((item) => item.id !== questionId),
  })),
  archiveQuestion: (questionId) => set((state) => ({
    questions: state.questions.map((question) => question.id === questionId
      ? { ...question, archivedAt: new Date().toISOString() }
      : question),
  })),
  restoreQuestion: (questionId) => set((state) => ({
    questions: state.questions.map((question) => question.id === questionId
      ? { ...question, archivedAt: undefined }
      : question),
  })),
  submitQuestionForReview: (questionId, autoApprove = false) => set((state) => ({
    questions: state.questions.map((question) => question.id === questionId
      ? { ...question, bankScope: 'SHARED', reviewStatus: autoApprove ? 'APPROVED' : 'PENDING_REVIEW' }
      : question),
  })),
  removeQuestionFromSharedBank: (questionId) => set((state) => ({
    questions: state.questions.map((question) => question.id === questionId
      ? { ...question, bankScope: 'PERSONAL', reviewStatus: 'PRIVATE', rejectionReason: undefined }
      : question),
  })),
  reviewQuestion: (questionId, approved, reason) => set((state) => ({
    questions: state.questions.map((question) => question.id === questionId
      ? { ...question, reviewStatus: approved ? 'APPROVED' : 'REJECTED', rejectionReason: approved ? undefined : reason }
      : question),
  })),
  reviewExam: (examId, approved, reason) => set((state) => ({
    exams: state.exams.map((exam) => exam.id === examId
      ? { ...exam, status: approved ? 'PUBLISHED' : 'REJECTED', rejectionReason: approved ? undefined : reason }
      : exam),
  })),
}))
