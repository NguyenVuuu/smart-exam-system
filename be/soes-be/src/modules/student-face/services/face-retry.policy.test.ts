import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { nextFaceRetryState } from './face-retry.policy'

const now = new Date('2026-11-08T08:00:00.000Z')
const policy = { failuresPerCycle: 3, maxFailuresBeforeManualReview: 6, cooldownSeconds: 120 }

describe('face verification retry policy', () => {
  it('allows two retries, then pauses for two minutes after failure three', () => {
    assert.equal(nextFaceRetryState(1, now, policy).cooldownUntil, null)
    assert.deepEqual(nextFaceRetryState(2, now, policy), {
      failedAttemptsSinceSuccess: 3,
      cooldownUntil: new Date('2026-11-08T08:02:00.000Z'),
      requiresManualReview: false,
    })
  })

  it('allows three more failures after cooldown, then requires a proctor', () => {
    assert.equal(nextFaceRetryState(4, now, policy).requiresManualReview, false)
    assert.deepEqual(nextFaceRetryState(5, now, policy), {
      failedAttemptsSinceSuccess: 6,
      cooldownUntil: null,
      requiresManualReview: true,
    })
  })
})
