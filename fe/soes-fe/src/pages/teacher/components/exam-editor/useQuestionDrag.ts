import { useState, type DragEvent, type PointerEvent } from 'react'
import type { ExamQuestionItem, ExamSection } from '../../types/teacher-exam.types'
import { canPlaceQuestionInSection, reorderExamQuestions, type QuestionDropTarget } from '../../utils/ExamQuestionReorder'

const INTERACTIVE_SELECTOR = 'button:not([data-drag-handle]), input, textarea, select, label, a, [role="combobox"]'

interface QuestionDragOptions {
  questions: ExamQuestionItem[]
  sections: ExamSection[]
  setQuestions: (questions: ExamQuestionItem[]) => void
  setActiveSectionId: (sectionId: string) => void
}

export function useQuestionDrag({ questions, sections, setQuestions, setActiveSectionId }: QuestionDragOptions) {
  const [draggedQuestionId, setDraggedQuestionId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<QuestionDropTarget | null>(null)

  const clearDrag = () => {
    setDraggedQuestionId(null)
    setDropTarget(null)
  }

  const canDropInSection = (sectionId: string) => {
    const question = questions.find((candidate) => candidate.questionId === draggedQuestionId)
    const section = sections.find((candidate) => candidate.id === sectionId)
    return Boolean(question && section && canPlaceQuestionInSection(question, section))
  }

  const startDrag = (event: DragEvent<HTMLDivElement>, questionId: string) => {
    const element = event.target as HTMLElement
    if (element.closest(INTERACTIVE_SELECTOR)) {
      event.preventDefault()
      return
    }
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', questionId)
    setDraggedQuestionId(questionId)
  }

  const prepareDrag = (event: PointerEvent<HTMLDivElement>) => {
    const element = event.target as HTMLElement
    event.currentTarget.draggable = !element.closest(INTERACTIVE_SELECTOR)
  }

  const questionDropTarget = (event: DragEvent<HTMLDivElement>, question: ExamQuestionItem): QuestionDropTarget => {
    const midpoint = event.currentTarget.getBoundingClientRect().top + event.currentTarget.offsetHeight / 2
    return { sectionId: question.sectionId ?? '', questionId: question.questionId, edge: event.clientY < midpoint ? 'before' : 'after' }
  }

  const dragOverQuestion = (event: DragEvent<HTMLDivElement>, question: ExamQuestionItem) => {
    if (!draggedQuestionId) return
    if (draggedQuestionId === question.questionId || !canDropInSection(question.sectionId ?? '')) {
      setDropTarget(null)
      return
    }
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    const target = questionDropTarget(event, question)
    setDropTarget((current) => current?.questionId === target.questionId && current?.edge === target.edge ? current : target)
  }

  const dropOnQuestion = (event: DragEvent<HTMLDivElement>, question: ExamQuestionItem) => {
    if (!draggedQuestionId || !canDropInSection(question.sectionId ?? '')) return
    event.preventDefault()
    setQuestions(reorderExamQuestions(questions, sections, draggedQuestionId, questionDropTarget(event, question)))
    clearDrag()
  }

  const dragOverSection = (event: DragEvent<HTMLButtonElement>, sectionId: string) => {
    if (!draggedQuestionId) return
    if (!canDropInSection(sectionId)) {
      setDropTarget(null)
      return
    }
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDropTarget((current) => current?.sectionId === sectionId && !current.questionId ? current : { sectionId })
  }

  const dropOnSection = (event: DragEvent<HTMLButtonElement>, sectionId: string) => {
    if (!draggedQuestionId || !canDropInSection(sectionId)) return
    event.preventDefault()
    setQuestions(reorderExamQuestions(questions, sections, draggedQuestionId, { sectionId }))
    setActiveSectionId(sectionId)
    clearDrag()
  }

  const moveWithKeyboard = (questionId: string, direction: -1 | 1) => {
    const question = questions.find((candidate) => candidate.questionId === questionId)
    if (!question) return
    const sectionQuestions = questions.filter((candidate) => candidate.sectionId === question.sectionId)
    const neighbor = sectionQuestions[sectionQuestions.findIndex((candidate) => candidate.questionId === questionId) + direction]
    if (!neighbor) return
    setQuestions(reorderExamQuestions(questions, sections, questionId, {
      sectionId: question.sectionId ?? '',
      questionId: neighbor.questionId,
      edge: direction === -1 ? 'before' : 'after',
    }))
  }

  return {
    draggedQuestionId,
    dropTarget,
    startDrag,
    prepareDrag,
    clearDrag,
    dragOverQuestion,
    dropOnQuestion,
    dragOverSection,
    dropOnSection,
    moveWithKeyboard,
  }
}
