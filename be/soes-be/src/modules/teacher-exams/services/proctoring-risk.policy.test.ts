import assert from 'node:assert/strict'
import test from 'node:test'
import { proctoringRiskSummary } from './proctoring-risk.policy'
import { forceSubmitAttemptSchema, violationReviewSchema } from '../validators/teacher-exam-grading.validator'

test('an unreviewed high severity signal requires review but does not assert misconduct', () => {
  assert.equal(proctoringRiskSummary([{ severity: 'HIGH', reviewStatus: 'PENDING' }]), 'NEEDS_REVIEW')
  assert.equal(proctoringRiskSummary([{ severity: 'HIGH', reviewStatus: 'CONFIRMED' }]), 'SERIOUS')
  assert.equal(proctoringRiskSummary([{ severity: 'HIGH', reviewStatus: 'DISMISSED' }]), 'NORMAL')
})

test('repeat signals are prioritized and a warning needs a reason', () => {
  const signals = Array.from({ length: 3 }, () => ({ severity: 'MEDIUM', reviewStatus: 'REVIEWED' as const }))
  assert.equal(proctoringRiskSummary(signals), 'NEEDS_REVIEW')
  assert.equal(violationReviewSchema.safeParse({ reviewStatus: 'WARNED' }).success, false)
  assert.equal(violationReviewSchema.safeParse({ reviewStatus: 'WARNED', reviewNote: 'Điện thoại xuất hiện trong ảnh' }).success, true)
  assert.equal(violationReviewSchema.safeParse({ reviewStatus: 'INVALIDATED', reviewNote: 'Bỏ qua API hủy bài' }).success, false)
  assert.equal(forceSubmitAttemptSchema.safeParse({ reason: ' ' }).success, false)
})
