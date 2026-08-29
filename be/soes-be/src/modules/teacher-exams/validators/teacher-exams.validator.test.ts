import assert from 'node:assert/strict'
import test from 'node:test'
import { examBodySchema } from './teacher-exams.validator'

const validExam = {
  title: 'Final exam sample',
  subjectId: 'subject-1',
  type: 'FINAL' as const,
  format: 'MIXED' as const,
  creationMethod: 'MANUAL' as const,
  defaultDurationMinutes: 60,
  totalPoints: 10,
  sections: [
    { id: 'section-1', title: 'Objective', type: 'OBJECTIVE' as const, targetPoints: 6, orderIndex: 1 },
    { id: 'section-2', title: 'Programming', type: 'PROGRAMMING' as const, targetPoints: 4, orderIndex: 2 },
  ],
}

test('accepts a valid exam section structure', () => {
  assert.equal(examBodySchema.safeParse(validExam).success, true)
})

test('rejects duplicate section IDs and order values', () => {
  const result = examBodySchema.safeParse({
    ...validExam,
    sections: validExam.sections.map((section) => ({ ...section, id: 'same-id', orderIndex: 1 })),
  })
  assert.equal(result.success, false)
})

test('rejects section points that differ from exam total points', () => {
  const result = examBodySchema.safeParse({
    ...validExam,
    sections: validExam.sections.map((section) => ({ ...section, targetPoints: 1 })),
  })
  assert.equal(result.success, false)
})
