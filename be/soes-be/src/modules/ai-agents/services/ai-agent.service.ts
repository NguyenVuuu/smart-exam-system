import { ForbiddenError } from '../../../errors/AppError'
import prisma from '../../../lib/prisma'
import { writeAuditLog } from '../../audit-logs/audit-log.writer'
import { studentInsights, teacherScheduleInsights } from '../../learning-analytics/services/learning-analytics.service'
import { requestInsightAgent } from './ai-agent.client'
import { loadStudentMaterial } from './student-material.service'

export async function askStudent(studentId: string, userId: string, message: string, materialId?: string) {
  const activeAttempt = await prisma.examAttempt.count({ where: { studentId, status: 'IN_PROGRESS' } })
  if (activeAttempt) throw new ForbiddenError('Learning assistant is unavailable during an exam')
  const evidence = await studentInsights(studentId)
  const material = materialId ? await loadStudentMaterial(studentId, materialId) : undefined
  await writeAuditLog(prisma, {
    userId, action: 'REQUEST_AI_STUDENT_INSIGHTS', entityType: 'Student', entityId: studentId,
    metadata: { ...(materialId && { materialId }), analyzedAttemptCount: evidence.analyzedAttemptCount },
  })
  const answer = await requestInsightAgent('/v1/student/insights', { message, ...evidence, material })
  return { answer, evidence }
}

export async function askTeacher(teacherId: string, userId: string, scheduleId: string, message: string) {
  const evidence = await teacherScheduleInsights(teacherId, scheduleId)
  await writeAuditLog(prisma, {
    userId, action: 'REQUEST_AI_TEACHER_INSIGHTS', entityType: 'ExamSchedule', entityId: scheduleId,
    metadata: { analyzedAttemptCount: evidence.analyzedAttemptCount },
  })
  const answer = await requestInsightAgent('/v1/teacher/insights', { message, ...evidence })
  return { answer, evidence }
}
