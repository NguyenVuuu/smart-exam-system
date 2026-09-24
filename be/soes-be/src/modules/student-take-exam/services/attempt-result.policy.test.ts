import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { resolveAttemptResultReason } from './attempt-result.policy'

const baseInput = {
  status: 'GRADED' as const,
  hasScore: true,
  resultReleaseMode: 'MANUAL' as const,
  resultReleaseAt: null,
  resultsPublishedAt: null,
}

describe('resolveAttemptResultReason', () => {
  it('releases a completed score immediately when configured', () => {
    assert.equal(
      resolveAttemptResultReason({ ...baseInput, resultReleaseMode: 'IMMEDIATE' }),
      'AVAILABLE',
    )
  })

  it('keeps a manually released score hidden until publication', () => {
    assert.equal(resolveAttemptResultReason(baseInput), 'PENDING_RELEASE')
  })

  it('does not expose a partial score while manual grading is pending', () => {
    assert.equal(
      resolveAttemptResultReason({
        ...baseInput,
        status: 'GRADING',
        resultReleaseMode: 'IMMEDIATE',
      }),
      'GRADING',
    )
  })

  it('releases an auto-submitted attempt after grading', () => {
    assert.equal(
      resolveAttemptResultReason({
        ...baseInput,
        status: 'AUTO_SUBMITTED',
        resultReleaseMode: 'IMMEDIATE',
      }),
      'AVAILABLE',
    )
  })

  it('releases a scheduled result only after its release time', () => {
    const releaseAt = new Date('2026-09-24T10:00:00.000Z')
    const input = { ...baseInput, resultReleaseMode: 'SCHEDULED' as const, resultReleaseAt: releaseAt }

    assert.equal(resolveAttemptResultReason(input, new Date('2026-09-24T09:59:59.000Z')), 'PENDING_RELEASE')
    assert.equal(resolveAttemptResultReason(input, releaseAt), 'AVAILABLE')
  })
})
