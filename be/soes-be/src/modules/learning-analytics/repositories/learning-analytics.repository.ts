import prisma from '../../../lib/prisma'
import { releasedResultScheduleWhere } from '../../exam-schedules/utils/result-release'

export function findReleasedStudentAttempts(studentId: string, now: Date) {
  return prisma.examAttempt.findMany({
    where: {
      studentId, status: { in: ['AUTO_SUBMITTED', 'GRADED', 'PUBLISHED'] },
      totalScore: { not: null }, invalidatedAt: null,
      examSchedule: {
        ...releasedResultScheduleWhere(now),
        endTime: { lte: now },
        reviewPolicy: { in: ['ANSWERS_NO_KEY', 'FULL_AFTER_RELEASE'] },
      },
    },
    select: {
      id: true,
      status: true,
      examSchedule: { select: {
        endTime: true, resultReleaseMode: true, resultReleaseAt: true,
        resultsPublishedAt: true, reviewPolicy: true,
      } },
      attemptQuestions: { select: {
        examQuestionId: true,
        examQuestion: { select: {
          points: true,
          exam: { select: { subjectId: true } },
          topics: { select: { topicId: true, code: true, name: true } },
        } },
      } },
      studentAnswers: { select: { examQuestionId: true, score: true } },
    },
    orderBy: { startedAt: 'desc' },
    take: 51,
  })
}

export const findTeacherSchedule = (teacherId: string, scheduleId: string) => prisma.examSchedule.findFirst({
  where: {
    id: scheduleId,
    scheduleCourses: { some: { courseOffering: { teacherId } } },
  },
  select: { id: true, title: true },
})

export const findTeacherScheduleAttempts = (teacherId: string, scheduleId: string) => prisma.examAttempt.findMany({
  where: {
    examScheduleId: scheduleId,
    courseOffering: { teacherId },
    status: { in: ['AUTO_SUBMITTED', 'GRADED', 'PUBLISHED'] },
    totalScore: { not: null }, invalidatedAt: null,
  },
  select: {
    studentId: true,
    courseOffering: { select: { id: true, code: true } },
    attemptQuestions: { select: {
      examQuestionId: true,
      examQuestion: { select: { title: true, points: true, exam: { select: { subjectId: true } },
        topics: { select: { topicId: true, code: true, name: true } } } },
    } },
    studentAnswers: { select: { examQuestionId: true, score: true } },
  },
  orderBy: { startedAt: 'desc' },
  take: 501,
})
