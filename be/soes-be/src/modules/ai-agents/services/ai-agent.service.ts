import { ForbiddenError, NotFoundError } from '../../../errors/AppError'
import prisma from '../../../lib/prisma'
import { writeAuditLog } from '../../audit-logs/audit-log.writer'
import { studentInsights, teacherScheduleInsights } from '../../learning-analytics/services/learning-analytics.service'
import { requestInsightAgent } from './ai-agent.client'
import { getStudentMaterials, loadStudentMaterial } from './student-material.service'
import { listConversations, loadConversation, recentHistory, saveTurn, type ConversationContext } from './agent-conversation.service'

async function studentContext(studentId: string, materialId?: string, includeContent = false): Promise<{ context: ConversationContext; material?: Awaited<ReturnType<typeof loadStudentMaterial>> }> {
  const activeAttempt = await prisma.examAttempt.count({ where: { studentId, status: 'IN_PROGRESS' } })
  if (activeAttempt) throw new ForbiddenError('Learning assistant is unavailable during an exam')
  if (materialId && !(await getStudentMaterials(studentId)).some(({ id }) => id === materialId)) {
    throw new NotFoundError('Material not found')
  }
  const material = materialId && includeContent ? await loadStudentMaterial(studentId, materialId) : undefined
  return { context: materialId ? { type: 'STUDENT_MATERIAL', id: materialId } : { type: 'STUDENT_RESULTS' }, material }
}

export async function askStudent(studentId: string, userId: string, message: string, materialId?: string, conversationId?: string) {
  const { context, material } = await studentContext(studentId, materialId, true)
  const evidence = await studentInsights(studentId)
  const history = await recentHistory(userId, context, conversationId)
  await writeAuditLog(prisma, {
    userId, action: 'REQUEST_AI_STUDENT_INSIGHTS', entityType: 'Student', entityId: studentId,
    metadata: { ...(materialId && { materialId }), analyzedAttemptCount: evidence.analyzedAttemptCount },
  })
  const answer = await requestInsightAgent('/v1/student/insights', { message, ...evidence, material, history })
  return { answer, evidence, conversationId: await saveTurn(userId, context, message, answer, conversationId) }
}

export async function askTeacher(teacherId: string, userId: string, scheduleId: string, message: string, conversationId?: string) {
  const evidence = await teacherScheduleInsights(teacherId, scheduleId)
  const context: ConversationContext = { type: 'TEACHER_SCHEDULE', id: scheduleId }
  const history = await recentHistory(userId, context, conversationId)
  await writeAuditLog(prisma, {
    userId, action: 'REQUEST_AI_TEACHER_INSIGHTS', entityType: 'ExamSchedule', entityId: scheduleId,
    metadata: { analyzedAttemptCount: evidence.analyzedAttemptCount },
  })
  const answer = await requestInsightAgent('/v1/teacher/insights', { message, ...evidence, history })
  return { answer, evidence, conversationId: await saveTurn(userId, context, message, answer, conversationId) }
}

export async function studentConversations(studentId: string, userId: string, materialId?: string) {
  const { context } = await studentContext(studentId, materialId)
  return listConversations(userId, context)
}

export async function studentConversation(studentId: string, userId: string, conversationId: string, materialId?: string) {
  const { context } = await studentContext(studentId, materialId)
  return loadConversation(userId, context, conversationId)
}

export async function teacherConversations(teacherId: string, userId: string, scheduleId: string) {
  await teacherScheduleInsights(teacherId, scheduleId)
  return listConversations(userId, { type: 'TEACHER_SCHEDULE', id: scheduleId })
}

export async function teacherConversation(teacherId: string, userId: string, scheduleId: string, conversationId: string) {
  await teacherScheduleInsights(teacherId, scheduleId)
  return loadConversation(userId, { type: 'TEACHER_SCHEDULE', id: scheduleId }, conversationId)
}
