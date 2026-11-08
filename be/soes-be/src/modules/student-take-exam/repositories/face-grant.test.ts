import assert from 'node:assert/strict'
import { afterEach, describe, it, mock } from 'node:test'
import prisma from '../../../lib/prisma'
import { assertOpenFaceEntry, consumeFaceContentGrant, consumeResumeFaceGrant } from './attempt.repository'

const originalEnabled = process.env.FACE_VERIFICATION_ENABLED

afterEach(() => {
  mock.restoreAll()
  if (originalEnabled === undefined) delete process.env.FACE_VERIFICATION_ENABLED
  else process.env.FACE_VERIFICATION_ENABLED = originalEnabled
})

describe('one-time exam entry grant', () => {
  it('binds a grant to the student and schedule and rejects a second claim', async () => {
    process.env.FACE_VERIFICATION_ENABLED = 'true'
    let consumed = false
    const transaction = {
      faceVerificationSession: {
        updateMany: async ({ where }: { where: Record<string, unknown> }) => {
          assert.equal(where.id, 'grant-1')
          assert.equal(where.studentId, 'student-1')
          assert.equal(where.examScheduleId, 'schedule-1')
          assert.equal(where.purpose, 'EXAM_ENTRY')
          assert.deepEqual(where.status, { in: ['PASSED', 'MANUAL_APPROVED'] })
          assert.ok(where.grantExpiresAt)
          if (consumed) return { count: 0 }
          consumed = true
          return { count: 1 }
        },
        findUniqueOrThrow: async () => ({ method: 'AWS_REKOGNITION' }),
      },
      auditLog: { create: async () => ({}) },
    }
    mock.method(prisma, '$transaction', async (callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction))

    await consumeResumeFaceGrant('grant-1', 'schedule-1', 'student-1', 'attempt-1', 'actor-1')
    await assert.rejects(
      consumeResumeFaceGrant('grant-1', 'schedule-1', 'student-1', 'attempt-1', 'actor-1'),
      /expired or was already used/,
    )
  })

  it('rejects a missing grant before attempting a claim', async () => {
    process.env.FACE_VERIFICATION_ENABLED = 'true'
    let claimAttempted = false
    mock.method(prisma, '$transaction', async (callback: (tx: unknown) => Promise<unknown>) => callback({
      faceVerificationSession: { updateMany: async () => { claimAttempted = true } },
    }))
    await assert.rejects(
      consumeResumeFaceGrant(undefined, 'schedule-1', 'student-1', 'attempt-1', 'actor-1'),
      /required before entering/,
    )
    assert.equal(claimAttempted, false)
  })

  it('rejects another student, another schedule, and an expired grant', async () => {
    process.env.FACE_VERIFICATION_ENABLED = 'true'
    let expiresAt = new Date(Date.now() + 60_000)
    const transaction = {
      faceVerificationSession: {
        updateMany: async ({ where }: { where: Record<string, unknown> }) => ({
          count: where.studentId === 'owner' && where.examScheduleId === 'schedule-1'
            && expiresAt > (where.grantExpiresAt as { gt: Date }).gt ? 1 : 0,
        }),
      },
    }
    mock.method(prisma, '$transaction', async (callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction))
    for (const [studentId, scheduleId] of [['other', 'schedule-1'], ['owner', 'schedule-2']]) {
      await assert.rejects(
        consumeResumeFaceGrant('grant-1', scheduleId, studentId, 'attempt-1', 'actor-1'),
        /expired or was already used/,
      )
    }
    expiresAt = new Date(Date.now() - 1000)
    await assert.rejects(
      consumeResumeFaceGrant('grant-1', 'schedule-1', 'owner', 'attempt-1', 'actor-1'),
      /expired or was already used/,
    )
  })

  it('permits only one of two concurrent claims', async () => {
    process.env.FACE_VERIFICATION_ENABLED = 'true'
    let consumed = false
    const transaction = {
      faceVerificationSession: {
        updateMany: async () => {
          if (consumed) return { count: 0 }
          consumed = true
          return { count: 1 }
        },
        findUniqueOrThrow: async () => ({ method: 'AWS_REKOGNITION' }),
      },
      auditLog: { create: async () => ({}) },
    }
    mock.method(prisma, '$transaction', async (callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction))
    const outcomes = await Promise.allSettled([
      consumeResumeFaceGrant('grant-1', 'schedule-1', 'student-1', 'attempt-1', 'actor-1'),
      consumeResumeFaceGrant('grant-1', 'schedule-1', 'student-1', 'attempt-1', 'actor-1'),
    ])
    assert.equal(outcomes.filter(({ status }) => status === 'fulfilled').length, 1)
    assert.equal(outcomes.filter(({ status }) => status === 'rejected').length, 1)
  })

  it('allows one content load for the latest grant and rejects replay', async () => {
    process.env.FACE_VERIFICATION_ENABLED = 'true'
    let contentOpened = false
    const originalDelegate = Object.getOwnPropertyDescriptor(prisma, 'faceVerificationSession')!
    Object.defineProperty(prisma, 'faceVerificationSession', { configurable: true, value: {
      findFirst: async () => ({ id: 'grant-1' }),
      updateMany: async ({ where }: { where: Record<string, unknown> }) => {
      assert.equal(where.studentId, 'student-1')
      assert.equal(where.examScheduleId, 'schedule-1')
      assert.equal(where.attemptId, 'attempt-1')
      assert.equal(where.contentAccessedAt, null)
      assert.ok(where.grantExpiresAt)
      if (contentOpened) return { count: 0 }
      contentOpened = true
      return { count: 1 }
      },
    } })
    try {
      await consumeFaceContentGrant('schedule-1', 'student-1', 'attempt-1', 'grant-1')
      await assert.rejects(
        consumeFaceContentGrant('schedule-1', 'student-1', 'attempt-1', 'grant-1'),
        /already used to open/,
      )
      await assert.rejects(
        consumeFaceContentGrant('schedule-1', 'student-1', 'attempt-1', 'grant-other'),
        /required before viewing/,
      )
    } finally {
      Object.defineProperty(prisma, 'faceVerificationSession', originalDelegate)
    }
  })

  it('accepts active exam requests only after the latest entry opened content', async () => {
    process.env.FACE_VERIFICATION_ENABLED = 'true'
    let latest = { id: 'grant-1', contentAccessedAt: null as Date | null }
    const originalDelegate = Object.getOwnPropertyDescriptor(prisma, 'faceVerificationSession')!
    Object.defineProperty(prisma, 'faceVerificationSession', { configurable: true, value: {
      findFirst: async ({ where }: { where: Record<string, unknown> }) => {
        assert.equal(where.studentId, 'student-1')
        assert.equal(where.examScheduleId, 'schedule-1')
        assert.equal(where.attemptId, 'attempt-1')
        return latest
      },
    } })
    try {
      await assert.rejects(assertOpenFaceEntry('schedule-1', 'student-1', 'attempt-1'), /required/)
      await assert.rejects(assertOpenFaceEntry('schedule-1', 'student-1', 'attempt-1', 'grant-1'), /required/)
      latest = { id: 'grant-1', contentAccessedAt: new Date() }
      await assertOpenFaceEntry('schedule-1', 'student-1', 'attempt-1', 'grant-1')
      latest = { id: 'grant-2', contentAccessedAt: null }
      await assert.rejects(assertOpenFaceEntry('schedule-1', 'student-1', 'attempt-1', 'grant-1'), /required/)
    } finally {
      Object.defineProperty(prisma, 'faceVerificationSession', originalDelegate)
    }
  })
})
