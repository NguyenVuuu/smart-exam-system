import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import { examConfig } from './index'

const originalHeartbeatTimeout = process.env.HEARTBEAT_TIMEOUT

afterEach(() => {
  if (originalHeartbeatTimeout === undefined) {
    delete process.env.HEARTBEAT_TIMEOUT
  } else {
    process.env.HEARTBEAT_TIMEOUT = originalHeartbeatTimeout
  }
  examConfig.setHeartbeatTimeoutSeconds(null)
})

describe('examConfig heartbeat timeout', () => {
  it('uses the system setting before the environment fallback', () => {
    process.env.HEARTBEAT_TIMEOUT = '45000'

    examConfig.setHeartbeatTimeoutSeconds(30)

    assert.equal(examConfig.heartbeatTimeoutMs, 30000)
  })

  it('uses the environment value when no valid system setting is loaded', () => {
    process.env.HEARTBEAT_TIMEOUT = '45000'

    examConfig.setHeartbeatTimeoutSeconds(null)

    assert.equal(examConfig.heartbeatTimeoutMs, 45000)
    assert.equal(examConfig.defaultHeartbeatTimeoutMs, 45000)
  })

  it('rejects a system setting outside the accepted range', () => {
    process.env.HEARTBEAT_TIMEOUT = '20000'

    examConfig.setHeartbeatTimeoutSeconds(5)

    assert.equal(examConfig.heartbeatTimeoutMs, 20000)
  })
})
