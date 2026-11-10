import type { ExamQuestionItem, ExamSection } from '../types/teacher-exam.types'
import { orderQuestionsBySection } from './ExamEditorUtils'

export type QuestionDropTarget = {
  sectionId: string
  questionId?: string
  edge?: 'before' | 'after'
}

export function canPlaceQuestionInSection(question: ExamQuestionItem, section: ExamSection): boolean {
  return question.question.type === 'PROGRAMMING'
    ? section.type === 'PROGRAMMING'
    : section.type === 'OBJECTIVE'
}

export function reorderExamQuestions(
  questions: ExamQuestionItem[],
  sections: ExamSection[],
  draggedQuestionId: string,
  target: QuestionDropTarget,
): ExamQuestionItem[] {
  const dragged = questions.find((question) => question.questionId === draggedQuestionId)
  const section = sections.find((candidate) => candidate.id === target.sectionId)
  if (!dragged || !section || !canPlaceQuestionInSection(dragged, section)) return questions
  if (draggedQuestionId === target.questionId) return questions

  const remaining = questions.filter((question) => question.questionId !== draggedQuestionId)
  let insertAt = remaining.length

  if (target.questionId) {
    const targetIndex = remaining.findIndex((question) => question.questionId === target.questionId && question.sectionId === section.id)
    if (targetIndex < 0) return questions
    insertAt = targetIndex + (target.edge === 'after' ? 1 : 0)
  } else {
    const lastSectionIndex = remaining.findLastIndex((question) => question.sectionId === section.id)
    if (lastSectionIndex >= 0) insertAt = lastSectionIndex + 1
  }

  remaining.splice(insertAt, 0, { ...dragged, sectionId: section.id })
  return orderQuestionsBySection(remaining, sections)
}
