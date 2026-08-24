import type { ExamQuestionItem, ExamSection, ExamType } from '../types/teacher-exam.types'
import type { Question, QuestionType } from '../types/teacher-question-bank.types'

export function buildInitialSections(examType: ExamType): ExamSection[] {
  if (examType === 'PROGRAMMING') {
    return [
      {
        id: 'sec-code',
        title: 'Phần 1: Lập trình',
        type: 'PROGRAMMING',
        description: 'Sinh viên viết code và hệ thống chấm bằng test case.',
        targetPoints: 10,
        order: 1,
      },
    ]
  }

  if (examType === 'MIXED') {
    return [
      {
        id: 'sec-objective',
        title: 'Phần 1: Trắc nghiệm',
        type: 'OBJECTIVE',
        description: 'Câu trắc nghiệm, có thể chấm tự động.',
        targetPoints: 5,
        order: 1,
      },
      {
        id: 'sec-code',
        title: 'Phần 2: Lập trình',
        type: 'PROGRAMMING',
        description: 'Sinh viên viết code và hệ thống chấm bằng test case.',
        targetPoints: 5,
        order: 2,
      },
    ]
  }

  return [
    {
      id: 'sec-objective',
      title: 'Phần 1: Trắc nghiệm',
      type: 'OBJECTIVE',
      description: 'Gồm 1 đáp án, nhiều đáp án và đúng/sai.',
      targetPoints: 10,
      order: 1,
    },
  ]
}

export function getDefaultTitle(examType: ExamType) {
  if (examType === 'PROGRAMMING') return 'Bài thi Lập trình thực hành Console'
  if (examType === 'MIXED') return 'Bài thi Hỗn hợp trắc nghiệm và lập trình'
  return 'Bài thi Trắc nghiệm tổng hợp'
}

export function isObjectiveQuestion(type: QuestionType) {
  return (
    type === 'SINGLE_CHOICE' ||
    type === 'MULTIPLE_CHOICE' ||
    type === 'TRUE_FALSE'
  )
}

export function isQuestionAllowedForExam(question: Question, examType: ExamType) {
  if (examType === 'PROGRAMMING') return question.type === 'PROGRAMMING'
  if (examType === 'MIXED') return isObjectiveQuestion(question.type) || question.type === 'PROGRAMMING'
  return isObjectiveQuestion(question.type)
}

export function inferSectionId(question: Question, sections: ExamSection[]) {
  if (question.type === 'PROGRAMMING') {
    return sections.find((section) => section.type === 'PROGRAMMING')?.id || sections[0].id
  }

  return sections.find((section) => section.type === 'OBJECTIVE')?.id || sections[0].id
}

function splitPointsByQuestion(totalPoints: number, questionCount: number) {
  if (questionCount === 0) return []

  const basePoint = Math.floor((totalPoints / questionCount) * 100) / 100
  return Array.from({ length: questionCount }, (_, index) => {
    if (index < questionCount - 1) return Number(basePoint.toFixed(2))
    return Number((totalPoints - basePoint * (questionCount - 1)).toFixed(2))
  })
}

export function balanceQuestionPointsBySection(
  questions: ExamQuestionItem[],
  sections: ExamSection[],
  sectionIds = sections.map((section) => section.id),
) {
  let nextQuestions = [...questions]

  sectionIds.forEach((sectionId) => {
    const section = sections.find((item) => item.id === sectionId)
    if (!section || section.targetPoints === undefined) return

    const sectionQuestionIndexes = nextQuestions
      .map((item, index) => (item.sectionId === sectionId ? index : -1))
      .filter((index) => index >= 0)
    const pointList = splitPointsByQuestion(section.targetPoints, sectionQuestionIndexes.length)

    nextQuestions = nextQuestions.map((item, index) => {
      const pointIndex = sectionQuestionIndexes.indexOf(index)
      return pointIndex >= 0 ? { ...item, points: pointList[pointIndex] } : item
    })
  })

  return nextQuestions
}
