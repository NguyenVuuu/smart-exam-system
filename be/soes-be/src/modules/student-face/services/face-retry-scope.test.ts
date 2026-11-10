import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { examRetryState } from './face-retry-scope'

type RetryDb = Parameters<typeof examRetryState>[0]
const completedAt = new Date('2026-11-09T10:00:00.000Z')

describe('exam face retry scope', () => {
  it('starts a fresh retry budget after the previous attempt is submitted', async () => {
    const db = {
      examAttempt: { findFirst: async () => ({ submittedAt: completedAt }) },
      faceVerificationSession: {
        findFirst: async ({ where }: { where: { status: unknown; completedAt?: { gt: Date } } }) => {
          assert.deepEqual(where.completedAt, { gt: completedAt })
          return null
        },
        count: async ({ where }: { where: { completedAt?: { gt: Date }; failureCode: unknown } }) => {
          assert.deepEqual(where.completedAt, { gt: completedAt })
          assert.deepEqual(where.failureCode, { not: 'CLIENT_CANCELLED' })
          return 0
        },
      },
    } as unknown as RetryDb
    assert.deepEqual(await examRetryState(db, 'student-1', 'schedule-1'), {
      failedAttemptsSinceSuccess: 0, cooldownUntil: null, requiresManualReview: false, windowStart: completedAt,
    })
  })

  it('starts a fresh retry budget when an unfinished attempt has timed out', async () => {
    const db = {
      examAttempt: { findFirst: async ({ where }: { where: { OR: unknown[] } }) => {
        assert.equal(where.OR.length, 2)
        return { submittedAt: null, deadlineAt: completedAt }
      } },
      faceVerificationSession: {
        findFirst: async () => null,
        count: async ({ where }: { where: { completedAt?: { gt: Date } } }) => {
          assert.deepEqual(where.completedAt, { gt: completedAt })
          return 0
        },
      },
    } as unknown as RetryDb
    assert.equal((await examRetryState(db, 'student-1', 'schedule-1')).windowStart, completedAt)
  })

  it('counts six failures only in the requested schedule', async () => {
    const db = {
      examAttempt: { findFirst: async () => null },
      faceVerificationSession: {
        findFirst: async ({ where }: { where: { status: unknown; examScheduleId: string } }) => {
          assert.equal(where.examScheduleId, 'schedule-2')
          return where.status === 'FAILED' ? { completedAt } : null
        },
        count: async ({ where }: { where: { examScheduleId: string } }) => {
          assert.equal(where.examScheduleId, 'schedule-2')
          return 6
        },
      },
    } as unknown as RetryDb
    const state = await examRetryState(db, 'student-1', 'schedule-2')
    assert.equal(state.failedAttemptsSinceSuccess, 6)
    assert.equal(state.requiresManualReview, true)
  })

  it('keeps the first cooldown when another pending scan fails in parallel', async () => {
    const fourthFailure = new Date(completedAt.getTime() + 10_000)
    const db = {
      examAttempt: { findFirst: async () => null },
      faceVerificationSession: {
        findFirst: async ({ where, skip }: { where: { status: unknown }; skip?: number }) => {
          if (where.status !== 'FAILED') return null
          return { completedAt: skip === 2 ? completedAt : fourthFailure }
        },
        count: async () => 4,
      },
    } as unknown as RetryDb
    const state = await examRetryState(db, 'student-1', 'schedule-1')
    assert.equal(state.failedAttemptsSinceSuccess, 4)
    assert.deepEqual(state.cooldownUntil, new Date(completedAt.getTime() + 120_000))
  })

  it('resets the failure count after a consumed face grant', async () => {
    const db = {
      examAttempt: { findFirst: async () => null },
      faceVerificationSession: {
        findFirst: async ({ where }: { where: { status: unknown; completedAt?: { gt: Date } } }) => {
          if (Array.isArray((where.status as { in?: string[] }).in)) {
            assert.deepEqual(where.status, { in: ['PASSED', 'CONSUMED'] })
            return { completedAt }
          }
          assert.deepEqual(where.completedAt, { gt: completedAt })
          return null
        },
        count: async ({ where }: { where: { completedAt?: { gt: Date } } }) => {
          assert.deepEqual(where.completedAt, { gt: completedAt })
          return 0
        },
      },
    } as unknown as RetryDb
    assert.equal((await examRetryState(db, 'student-1', 'schedule-1')).failedAttemptsSinceSuccess, 0)
  })
})
