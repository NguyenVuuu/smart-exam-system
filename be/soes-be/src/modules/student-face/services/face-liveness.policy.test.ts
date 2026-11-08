import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { assessLiveness } from './face-liveness.policy'

const image = new Uint8Array([1])
const thresholds = { enrollmentLivenessThreshold: 80, livenessThreshold: 90 }

describe('face liveness thresholds', () => {
  it('accepts a genuine enrollment at 87 while retaining the stronger exam entry threshold', () => {
    const result = { status: 'SUCCEEDED', confidence: 87, image }
    assert.deepEqual(assessLiveness('ENROLLMENT', result, thresholds), { accepted: true, image })
    assert.deepEqual(assessLiveness('EXAM_ENTRY', result, thresholds), { accepted: false, failureCode: 'LIVENESS_LOW_CONFIDENCE' })
  })

  it('does not accept a low score, incomplete check, or missing reference image', () => {
    assert.equal(assessLiveness('ENROLLMENT', { status: 'SUCCEEDED', confidence: 67, image }, thresholds).accepted, false)
    assert.equal(assessLiveness('ENROLLMENT', { status: 'FAILED', confidence: 100, image }, thresholds).accepted, false)
    assert.deepEqual(assessLiveness('ENROLLMENT', { status: 'SUCCEEDED', confidence: 99 }, thresholds), {
      accepted: false, failureCode: 'LIVENESS_REFERENCE_IMAGE_MISSING',
    })
  })
})
