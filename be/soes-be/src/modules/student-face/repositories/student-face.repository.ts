import prisma from '../../../lib/prisma'
import { ForbiddenError } from '../../../errors/AppError'
import type { Prisma } from '@prisma/client'

export function findFaceProfile(studentId: string) {
  return prisma.studentFaceProfile.findUnique({ where: { studentId }, select: {
    studentId: true, status: true, providerFaceId: true, enrolledAt: true,
  } })
}

export function findManualApproval(studentId: string, scheduleId: string, windowStart: Date | null) {
  return prisma.faceVerificationSession.findFirst({
    where: {
      studentId, examScheduleId: scheduleId, purpose: 'EXAM_ENTRY', method: 'MANUAL_OVERRIDE',
      status: 'MANUAL_APPROVED', consumedAt: null, grantExpiresAt: { gt: new Date() },
      ...(windowStart ? { createdAt: { gt: windowStart } } : {}),
    },
    select: { id: true, grantExpiresAt: true },
    orderBy: { completedAt: 'desc' },
  })
}

export function countPendingSessions(studentId: string, purpose: 'ENROLLMENT' | 'EXAM_ENTRY', scheduleId?: string, windowStart?: Date | null) {
  return prisma.faceVerificationSession.count({
    where: {
      studentId, purpose, examScheduleId: scheduleId ?? null,
      status: { in: ['CREATED', 'PROCESSING'] }, expiresAt: { gt: new Date() },
      ...(windowStart ? { createdAt: { gt: windowStart } } : {}),
    },
  })
}

export function countRecentSessions(studentId: string, since: Date, purpose: 'ENROLLMENT' | 'EXAM_ENTRY', scheduleId?: string) {
  return prisma.faceVerificationSession.count({
    where: { studentId, purpose, examScheduleId: scheduleId ?? null, createdAt: { gte: since }, method: 'AWS_REKOGNITION' },
  })
}

export function createFaceSession(studentId: string, purpose: 'ENROLLMENT' | 'EXAM_ENTRY', providerSessionId: string, expiresAt: Date, scheduleId?: string) {
  return prisma.faceVerificationSession.create({
    data: { studentId, purpose, examScheduleId: scheduleId, providerSessionId, expiresAt },
  })
}

export function findFaceSession(studentId: string, id: string) {
  return prisma.faceVerificationSession.findFirst({ where: { id, studentId } })
}

export function transitionFaceSession(id: string, from: 'CREATED' | 'PROCESSING', to: 'CREATED' | 'PROCESSING' | 'EXPIRED') {
  return prisma.faceVerificationSession.updateMany({ where: { id, status: from }, data: { status: to } })
}

export function cancelFaceSession(tx: Prisma.TransactionClient, studentId: string, id: string) {
  return tx.faceVerificationSession.updateMany({
    where: { id, studentId, status: 'CREATED' },
    data: { status: 'FAILED', failureCode: 'CLIENT_CANCELLED', completedAt: new Date() },
  })
}

export function findAssignedProctor(teacherId: string, scheduleId: string, courseOfferingId: string) {
  return prisma.examScheduleProctor.findFirst({
    where: {
      teacherId,
      examScheduleCourse: { examScheduleId: scheduleId, courseOfferingId },
    },
    select: { id: true },
  })
}

export async function findPendingManualReviews(teacherId: string, scheduleId: string) {
  const assignments = await prisma.examScheduleProctor.findMany({
    where: { teacherId, examScheduleCourse: { examScheduleId: scheduleId } },
    select: { examScheduleCourse: { select: { courseOfferingId: true } } },
  })
  if (!assignments.length) throw new ForbiddenError('Only an assigned proctor may view face verification requests')

  const schedule = await prisma.examSchedule.findUnique({
    where: { id: scheduleId },
    select: { targetStudents: { select: { studentId: true } } },
  })
  const targetIds = schedule?.targetStudents.map(({ studentId }) => studentId) ?? []
  return prisma.studentFaceProfile.findMany({
    where: {
      status: 'ACTIVE',
      studentId: targetIds.length ? { in: targetIds } : undefined,
      student: {
        enrollments: { some: { courseOfferingId: { in: assignments.map(({ examScheduleCourse }) => examScheduleCourse.courseOfferingId) } } },
        faceVerifications: { some: { examScheduleId: scheduleId, purpose: 'EXAM_ENTRY', status: 'FAILED' } },
      },
    },
    select: {
      studentId: true, referenceImageCapturedAt: true,
      student: { select: { studentCode: true, user: { select: { fullName: true } } } },
    },
    orderBy: { updatedAt: 'asc' },
  })
}
