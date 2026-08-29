import type {
  QuestionAnswer,
  TakeExamQuestion,
  TakeExamQuestionType,
} from '../../types/take-exam.types'

export type QuestionStatus = 'current' | 'answered' | 'unanswered'

export function formatRemainingTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, totalSeconds)
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')
}

export function formatQuestionProgress(answered: number, total: number): string {
  return `${answered}/${total} câu`
}

export function getQuestionTypeLabel(type: TakeExamQuestionType): string {
  const labels: Record<TakeExamQuestionType, string> = {
    SINGLE_CHOICE: 'Trắc nghiệm một đáp án',
    MULTIPLE_CHOICE: 'Trắc nghiệm nhiều đáp án',
    CODING: 'Bài tập lập trình',
  }

  return labels[type]
}

export function hasAnswer(answer: QuestionAnswer | undefined): boolean {
  if (Array.isArray(answer)) return answer.length > 0
  return typeof answer === 'string' && answer.trim().length > 0
}

export function getQuestionStatus(
  question: TakeExamQuestion,
  currentQuestionId: string,
  answers: Record<string, QuestionAnswer | undefined>,
): QuestionStatus {
  if (question.id === currentQuestionId) return 'current'
  return hasAnswer(answers[question.id]) ? 'answered' : 'unanswered'
}
