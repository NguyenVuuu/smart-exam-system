import assert from 'node:assert/strict'
import { test } from 'node:test'
import { normalizeScreenHeartbeat, normalizeWebcamHeartbeat } from './heartbeat.policy'

test('required media cannot be marked not required by the student', () => {
  assert.equal(normalizeWebcamHeartbeat(true, 'NOT_REQUIRED'), 'DISCONNECTED')
  assert.equal(normalizeScreenHeartbeat(true, 'NOT_REQUIRED'), 'STOPPED')
  assert.equal(normalizeWebcamHeartbeat(true), 'DISCONNECTED')
  assert.equal(normalizeScreenHeartbeat(true), 'STOPPED')
})

test('disabled media monitoring ignores client-reported active status', () => {
  assert.equal(normalizeWebcamHeartbeat(false, 'ACTIVE'), 'NOT_REQUIRED')
  assert.equal(normalizeScreenHeartbeat(false, 'ACTIVE'), 'NOT_REQUIRED')
})
