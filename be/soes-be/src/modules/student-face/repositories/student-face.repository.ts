import prisma from '../../../lib/prisma'

export function findFaceProfile(studentId: string) {
  return prisma.studentFaceProfile.findUnique({ where: { studentId } })
}

export function findManualApproval(studentId: string, scheduleId: string) {
  return prisma.faceVerificationSession.findFirst({
    where: {
      studentId, examScheduleId: scheduleId, purpose: 'EXAM_ENTRY', method: 'MANUAL_OVERRIDE',
      status: 'MANUAL_APPROVED', consumedAt: null, grantExpiresAt: { gt: new Date() },
    },
    select: { id: true, grantExpiresAt: true },
    orderBy: { completedAt: 'desc' },
  })
}

export function countPendingSessions(studentId: string, purpose: 'ENROLLMENT' | 'EXAM_ENTRY', scheduleId?: string) {
  return prisma.faceVerificationSession.count({
    where: {
      studentId, purpose, examScheduleId: scheduleId ?? null,
      status: { in: ['CREATED', 'PROCESSING'] }, expiresAt: { gt: new Date() },
    },
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

export function findAssignedProctor(teacherId: string, scheduleId: string, courseOfferingId: string) {
  return prisma.examScheduleProctor.findFirst({
    where: {
      teacherId,
      examScheduleCourse: { examScheduleId: scheduleId, courseOfferingId },
    },
    select: { id: true },
  })
}
