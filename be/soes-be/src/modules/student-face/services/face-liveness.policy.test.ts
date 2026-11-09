import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { assessFaceVisibility, assessLiveness } from './face-liveness.policy'

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

describe('face visibility before enrollment or exam entry', () => {
  const clearFace = { FaceOccluded: { Value: false, Confidence: 99 } }
  const coveredFace = { FaceOccluded: { Value: true, Confidence: 99 } }

  it('accepts one unobstructed reference face', () => {
    assert.deepEqual(assessFaceVisibility({ reference: [clearFace], audit: [] }), { accepted: true })
  })

  it('rejects a covered reference face even after liveness succeeds', () => {
    assert.deepEqual(assessFaceVisibility({ reference: [coveredFace], audit: [] }), {
      accepted: false, failureCode: 'FACE_OBSTRUCTED',
    })
  })

  it('rejects an obstruction visible in an audit frame', () => {
    assert.deepEqual(assessFaceVisibility({ reference: [clearFace], audit: [[coveredFace]] }), {
      accepted: false, failureCode: 'FACE_OBSTRUCTED', auditImageIndex: 0,
    })
  })

  it('rejects an audit frame with no visible face and identifies that frame for review', () => {
    assert.deepEqual(assessFaceVisibility({ reference: [clearFace], audit: [[clearFace], []] }), {
      accepted: false, failureCode: 'FACE_NOT_CLEAR', auditImageIndex: 1,
    })
  })

  it('rejects uncertain clear-face assessments', () => {
    const uncertainFace = { FaceOccluded: { Value: false, Confidence: 60 } }
    assert.deepEqual(assessFaceVisibility({ reference: [uncertainFace], audit: [] }), {
      accepted: false, failureCode: 'FACE_NOT_CLEAR',
    })
    assert.deepEqual(assessFaceVisibility({ reference: [clearFace], audit: [[uncertainFace]] }), {
      accepted: false, failureCode: 'FACE_NOT_CLEAR', auditImageIndex: 0,
    })
  })

  it('rejects a missing, ambiguous, or unassessed reference face', () => {
    for (const reference of [[], [clearFace, clearFace], [{}]]) {
      assert.deepEqual(assessFaceVisibility({ reference, audit: [] }), {
        accepted: false, failureCode: 'FACE_NOT_CLEAR',
      })
    }
  })
})
