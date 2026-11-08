import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { after, describe, it } from 'node:test'
import prisma from '../../../lib/prisma'
import { findPendingManualReviews } from '../repositories/student-face.repository'
import { completeSession, createSession } from './student-face.service'

const enabledBefore = process.env.FACE_VERIFICATION_ENABLED
const providerBefore = process.env.FACE_VERIFICATION_PROVIDER

after(async () => {
  if (enabledBefore === undefined) delete process.env.FACE_VERIFICATION_ENABLED
  else process.env.FACE_VERIFICATION_ENABLED = enabledBefore
  if (providerBefore === undefined) delete process.env.FACE_VERIFICATION_PROVIDER
  else process.env.FACE_VERIFICATION_PROVIDER = providerBefore
  await prisma.$disconnect()
})

describe('face enrollment transaction (PostgreSQL)', () => {
  it('activates one profile when two enrollment sessions finish together', { skip: process.env.FACE_INTEGRATION_TEST !== '1' }, async () => {
    process.env.FACE_VERIFICATION_ENABLED = 'true'
    process.env.FACE_VERIFICATION_PROVIDER = 'mock'
    const user = await prisma.user.create({
      data: { fullName: 'Face enrollment test', password: 'test-only',
        students: { create: { studentCode: `face-test-${randomUUID()}` } } },
      select: { id: true, students: { select: { id: true } } },
    })
    const studentId = user.students[0].id
    try {
      const [first, second] = await Promise.all([
        createSession(studentId, 'ENROLLMENT'), createSession(studentId, 'ENROLLMENT'),
      ])
      const results = await Promise.allSettled([
        completeSession(studentId, first.id, user.id),
        completeSession(studentId, second.id, user.id),
      ])
      assert.equal(results.filter(({ status }) => status === 'fulfilled').length, 1)
      assert.equal(results.filter(({ status }) => status === 'rejected').length, 1)
      const profile = await prisma.studentFaceProfile.findUnique({ where: { studentId } })
      assert.equal(profile?.status, 'ACTIVE')
      assert.match(profile?.providerFaceId ?? '', /^mock-face-[0-9a-f-]{36}$/)
      assert.equal(await prisma.faceVerificationSession.count({ where: { studentId, status: 'PASSED' } }), 1)
    } finally {
      await prisma.faceVerificationSession.deleteMany({ where: { studentId } })
      await prisma.studentFaceProfile.deleteMany({ where: { studentId } })
      await prisma.student.delete({ where: { id: studentId } })
      await prisma.auditLog.deleteMany({ where: { userId: user.id } })
      await prisma.user.delete({ where: { id: user.id } })
    }
  })

  it('does not expose manual review requests to an unassigned teacher', { skip: process.env.FACE_INTEGRATION_TEST !== '1' }, async () => {
    await assert.rejects(findPendingManualReviews(randomUUID(), randomUUID()), /Only an assigned proctor/)
  })
})
