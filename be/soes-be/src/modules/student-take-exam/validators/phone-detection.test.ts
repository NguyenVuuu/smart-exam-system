import assert from 'node:assert/strict'
import { test } from 'node:test'
import { recordViolationBodySchema } from './student-take-exam.validator'

const metadata = {
  model: 'efficientdet_lite0', category: 'cell phone', confidence: 0.85,
  boundingBox: { originX: 20, originY: 30, width: 50, height: 100 },
  frameWidth: 640, frameHeight: 480,
  capturedAt: '2026-09-22T10:00:00.000Z', observedDurationMs: 3000,
}
const body = { violationType: 'PHONE_DETECTED', severity: 'MEDIUM', metadata }

test('phone metadata survives JSON and multipart validation', () => {
  assert.deepEqual(recordViolationBodySchema.parse(body).metadata, metadata)
  assert.deepEqual(recordViolationBodySchema.parse({ ...body, metadata: JSON.stringify(metadata) }).metadata, metadata)
})

test('invalid or missing phone metadata is rejected', () => {
  for (const value of [undefined, '{broken', { ...metadata, confidence: 2 }, { ...metadata, boundingBox: { ...metadata.boundingBox, width: -1 } }]) {
    assert.equal(recordViolationBodySchema.safeParse({ ...body, metadata: value }).success, false)
  }
})

test('existing face events do not require phone metadata', () => {
  assert.equal(recordViolationBodySchema.safeParse({ violationType: 'NO_FACE', severity: 'MEDIUM' }).success, true)
})
