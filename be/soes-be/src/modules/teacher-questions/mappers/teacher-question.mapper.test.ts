import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { after, before, test } from 'node:test'
import { encryptField } from '../../../lib/encryption'
import { sealExamOption } from '../../../lib/exam-option-secret'
import { toTeacherQuestionDto } from './teacher-question.mapper'

const originalKey = process.env.EXAM_ENCRYPTION_KEY
before(() => { process.env.EXAM_ENCRYPTION_KEY = randomBytes(32).toString('hex') })
after(() => {
  if (originalKey === undefined) delete process.env.EXAM_ENCRYPTION_KEY
  else process.env.EXAM_ENCRYPTION_KEY = originalKey
})

test('question bank DTO decrypts content and answer key without exposing ciphertext metadata', () => {
  const now = new Date()
  const row = {
    id: 'question', title: encryptField('Tiêu đề kín'), content: encryptField('Nội dung kín'),
    explanation: encryptField('Giải thích kín'), type: 'SINGLE_CHOICE', difficulty: 'EASY',
    aiDifficultyReason: null, source: 'MANUAL', language: null,
    subject: { id: 'subject', code: 'SUB', name: 'Môn học', departmentId: 'department' },
    owner: { id: 'teacher', user: { fullName: 'Giảng viên' } },
    options: [{ id: 'option', ...sealExamOption('Đáp án đúng', true) }],
    programmingConfig: null, programmingTests: [], questionBankItem: null,
    createdAt: now, updatedAt: now, archivedAt: null,
  } as unknown as Parameters<typeof toTeacherQuestionDto>[0]
  const dto = toTeacherQuestionDto(row)
  assert.equal(dto.title, 'Tiêu đề kín')
  assert.equal(dto.content, 'Nội dung kín')
  assert.equal(dto.explanation, 'Giải thích kín')
  assert.deepEqual(dto.options, [{ id: 'option', content: 'Đáp án đúng', isCorrect: true }])
})
