import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { assessLiveness } from './face-liveness.policy'

const image = new Uint8Array([1])
const thresholds = { enrollmentLivenessThreshold: 70, livenessThreshold: 70 }

describe('face liveness thresholds', () => {
  it('accepts enrollment and exam entry at 70', () => {
    const result = { status: 'SUCCEEDED', confidence: 70, image }
    assert.deepEqual(assessLiveness('ENROLLMENT', result, thresholds), { accepted: true, image })
    assert.deepEqual(assessLiveness('EXAM_ENTRY', result, thresholds), { accepted: true, image })
  })

  it('does not accept a low score, incomplete check, or missing reference image', () => {
    assert.equal(assessLiveness('ENROLLMENT', { status: 'SUCCEEDED', confidence: 69, image }, thresholds).accepted, false)
    assert.equal(assessLiveness('EXAM_ENTRY', { status: 'SUCCEEDED', confidence: 70, image }, thresholds).accepted, true)
    assert.equal(assessLiveness('ENROLLMENT', { status: 'FAILED', confidence: 100, image }, thresholds).accepted, false)
    assert.deepEqual(assessLiveness('ENROLLMENT', { status: 'SUCCEEDED', confidence: 99 }, thresholds), {
      accepted: false, failureCode: 'LIVENESS_REFERENCE_IMAGE_MISSING',
    })
  })
})
