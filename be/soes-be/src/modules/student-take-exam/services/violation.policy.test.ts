import assert from 'node:assert/strict'
import { test } from 'node:test'
import { studentViolationSeverity } from './violation.policy'
import { recordViolationBodySchema } from '../validators/student-take-exam.validator'

const flags = {
  enableTabLock: true, requireFullscreen: true, enableWebcam: true,
  enableScreenMonitoring: true, blockCopyPaste: true, blockRightClick: true,
}

test('student cannot submit proctor-only events', () => {
  assert.equal(recordViolationBodySchema.safeParse({ violationType: 'PROCTOR_WEBCAM_CAPTURE' }).success, false)
  assert.throws(() => studentViolationSeverity('PROCTOR_SCREEN_CAPTURE', flags))
})

test('severity is determined by server policy and schedule flags', () => {
  assert.equal(studentViolationSeverity('PHONE_DETECTED', flags), 'HIGH')
  assert.throws(() => studentViolationSeverity('PHONE_DETECTED', { ...flags, enableWebcam: false }))
  assert.throws(() => studentViolationSeverity('TAB_SWITCH', { ...flags, enableTabLock: false }))
  assert.throws(() => studentViolationSeverity('SCREEN_SHARE_STOPPED', { ...flags, enableScreenMonitoring: false }))
  assert.throws(() => studentViolationSeverity('COPY_PASTE', { ...flags, blockCopyPaste: false }))
  assert.throws(() => studentViolationSeverity('RIGHT_CLICK', { ...flags, blockRightClick: false }))
  assert.throws(() => studentViolationSeverity('FULLSCREEN_EXIT', { ...flags, requireFullscreen: false }))
})

test('client severity and timestamps are discarded at the request boundary', () => {
  const parsed = recordViolationBodySchema.parse({ violationType: 'TAB_SWITCH', severity: 'HIGH', detectedAt: '2000-01-01T00:00:00.000Z' })
  assert.equal('severity' in parsed, false)
  assert.equal('detectedAt' in parsed, false)
})
