import { expect, test } from '@playwright/test'
import { reorderExamQuestions } from '../../src/pages/teacher/utils/ExamQuestionReorder'
import type { ExamQuestionItem, ExamSection } from '../../src/pages/teacher/types/teacher-exam.types'

const sections = [
  { id: 'objective-a', type: 'OBJECTIVE' },
  { id: 'objective-b', type: 'OBJECTIVE' },
  { id: 'programming', type: 'PROGRAMMING' },
] as ExamSection[]

const questions = [
  { questionId: 'a', sectionId: 'objective-a', question: { type: 'SINGLE_CHOICE' }, points: 2, order: 1 },
  { questionId: 'b', sectionId: 'objective-a', question: { type: 'MULTIPLE_CHOICE' }, points: 3, order: 2 },
  { questionId: 'c', sectionId: 'objective-a', question: { type: 'SINGLE_CHOICE' }, points: 4, order: 3 },
  { questionId: 'd', sectionId: 'programming', question: { type: 'PROGRAMMING' }, points: 1, order: 4 },
] as ExamQuestionItem[]

test('moves a question before or after another question in the same section', () => {
  const before = reorderExamQuestions(questions, sections, 'c', { sectionId: 'objective-a', questionId: 'a', edge: 'before' })
  expect(before.map(({ questionId }) => questionId)).toEqual(['c', 'a', 'b', 'd'])
  expect(before.map(({ order }) => order)).toEqual([1, 2, 3, 4])

  const after = reorderExamQuestions(questions, sections, 'a', { sectionId: 'objective-a', questionId: 'c', edge: 'after' })
  expect(after.map(({ questionId }) => questionId)).toEqual(['b', 'c', 'a', 'd'])
  expect(after.find(({ questionId }) => questionId === 'a')?.points).toBe(2)
})

test('dropping on a compatible section tab appends and updates its section', () => {
  const moved = reorderExamQuestions(questions, sections, 'a', { sectionId: 'objective-b' })
  expect(moved.map(({ questionId }) => questionId)).toEqual(['b', 'c', 'a', 'd'])
  expect(moved.find(({ questionId }) => questionId === 'a')?.sectionId).toBe('objective-b')

  const appended = reorderExamQuestions(moved, sections, 'b', { sectionId: 'objective-b' })
  expect(appended.map(({ questionId }) => questionId)).toEqual(['c', 'a', 'b', 'd'])
})

test('rejects a question dropped into an incompatible section', () => {
  expect(reorderExamQuestions(questions, sections, 'a', { sectionId: 'programming' })).toBe(questions)
  expect(reorderExamQuestions(questions, sections, 'd', { sectionId: 'objective-a' })).toBe(questions)
})
