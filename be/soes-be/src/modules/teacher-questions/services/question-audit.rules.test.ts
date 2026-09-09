import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  auditQuestion,
  classifyAuditIssues,
  type AuditableQuestion,
} from './question-audit.rules'

const objectiveQuestion = (overrides: Partial<AuditableQuestion> = {}): AuditableQuestion => ({
  title: 'Cau hoi hop le',
  content: 'Cau hoi hop le',
  explanation: 'Loi giai',
  type: 'SINGLE_CHOICE',
  language: null,
  options: [
    { content: 'Phuong an A', isCorrect: true },
    { content: 'Phuong an B', isCorrect: false },
  ],
  testCases: [],
  ...overrides,
})

describe('auditQuestion', () => {
  it('accepts a complete single-choice question', () => {
    assert.deepEqual(auditQuestion(objectiveQuestion()), [])
  })

  it('returns every issue found on the same objective question', () => {
    const issues = auditQuestion(objectiveQuestion({
      options: [
        { content: '', isCorrect: false },
        { content: 'Lap', isCorrect: false },
        { content: ' lap ', isCorrect: false },
      ],
    }))

    assert.deepEqual(issues.map(({ code }) => code), [
      'OPTION_CONTENT_REQUIRED',
      'OPTION_CONTENT_DUPLICATED',
      'SINGLE_CORRECT_OPTION_REQUIRED',
    ])
  })

  it('rejects a multiple-choice question whose every option is correct', () => {
    const issues = auditQuestion(objectiveQuestion({
      type: 'MULTIPLE_CHOICE',
      options: [
        { content: 'A', isCorrect: true },
        { content: 'B', isCorrect: true },
      ],
    }))

    assert.deepEqual(issues.map(({ code }) => code), ['MULTIPLE_CHOICE_INCORRECT_OPTION_REQUIRED'])
  })

  it('requires exact true and false options', () => {
    const issues = auditQuestion(objectiveQuestion({
      type: 'TRUE_FALSE',
      options: [
        { content: 'Co', isCorrect: true },
        { content: 'Khong', isCorrect: false },
      ],
    }))

    assert.deepEqual(issues.map(({ code }) => code), ['TRUE_FALSE_OPTIONS_INVALID'])
  })

  it('reports all missing programming requirements', () => {
    const issues = auditQuestion(objectiveQuestion({
      type: 'PROGRAMMING',
      content: '',
      language: null,
      options: [],
      timeLimitMs: undefined,
      memoryLimitMb: undefined,
      maxCodeSizeKb: undefined,
      testCases: [],
    }))

    assert.deepEqual(issues.map(({ code }) => code), [
      'PROGRAMMING_CONTENT_REQUIRED',
      'PROGRAMMING_LANGUAGE_REQUIRED',
      'TIME_LIMIT_INVALID',
      'MEMORY_LIMIT_INVALID',
      'CODE_SIZE_LIMIT_INVALID',
      'TEST_CASE_REQUIRED',
    ])
  })

  it('reports public-test, expected-output, duplicate-test, and explanation issues', () => {
    const issues = auditQuestion(objectiveQuestion({
      type: 'PROGRAMMING',
      language: 'JAVA',
      options: [],
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      maxCodeSizeKb: 256,
      explanation: ' ',
      testCases: [
        { input: '1', expectedOutput: '', isHidden: true },
        { input: '1', expectedOutput: '', isHidden: true },
      ],
    }))

    assert.deepEqual(issues.map(({ code }) => code), [
      'PUBLIC_TEST_CASE_REQUIRED',
      'TEST_EXPECTED_OUTPUT_REQUIRED',
      'TEST_CASE_DUPLICATED',
      'EXPLANATION_RECOMMENDED',
    ])
    assert.equal(classifyAuditIssues(issues), 'HIGH')
  })

  it('classifies an explanation-only issue as a warning', () => {
    const issues = auditQuestion(objectiveQuestion({ explanation: null }))

    assert.deepEqual(issues.map(({ code }) => code), ['EXPLANATION_RECOMMENDED'])
    assert.equal(classifyAuditIssues(issues), 'LOW')
    assert.equal(classifyAuditIssues([]), null)
  })
})
