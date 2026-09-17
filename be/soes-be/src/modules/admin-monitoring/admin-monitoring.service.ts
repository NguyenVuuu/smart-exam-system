import type { AttemptStatus, ExamScheduleStatus } from '@prisma/client'
import prisma from '../../lib/prisma'
import { computeScheduleStatus } from '../exam-schedules/mappers/exam-schedule.mapper'
import { getLocalViolationEvidenceUrl, getViolationEvidenceUrl } from '../../lib/minio'
import { logger } from '../../lib/logger'

const SUBMITTED_STATUSES: AttemptStatus[] = ['SUBMITTED', 'AUTO_SUBMITTED', 'GRADING', 'GRADED', 'PUBLISHED']
const SCORED_STATUSES: AttemptStatus[] = ['GRADED', 'PUBLISHED']

const toNumber = (value: unknown) => Number(value ?? 0)

const passRate = (passed: number, total: number) => (total > 0 ? Math.round((passed / total) * 100) : 0)

function formatCourseCodes(courses: Array<{ courseOffering: { code: string } }>) {
  return courses.map(({ courseOffering }) => courseOffering.code).join(', ')
}

export async function getAdminProctoringOverview() {
  const now = new Date()
  const schedules = await prisma.examSchedule.findMany({
    where: {
      status: { in: ['SCHEDULED', 'OPEN'] },
      startTime: { lte: now },
      endTime: { gt: now },
    },
    orderBy: { startTime: 'asc' },
    include: {
      exam: { include: { subject: true } },
      scheduleCourses: {
        include: {
          courseOffering: {
            include: { _count: { select: { enrollments: true } } },
          },
        },
      },
      attempts: {
        include: {
          examSession: true,
          student: { include: { user: true } },
          violations: {
            orderBy: { detectedAt: 'desc' },
            include: { evidences: true },
          },
          studentAnswers: { select: { id: true } },
        },
      },
    },
  })

  return Promise.all(schedules.map(async (schedule) => {
    const computedStatus = computeScheduleStatus(schedule.status, schedule.startTime, schedule.endTime)
    const submitted = schedule.attempts.filter(({ status }) => SUBMITTED_STATUSES.includes(status)).length
    const inProgress = schedule.attempts.filter(({ status }) => status === 'IN_PROGRESS').length
    const online = schedule.attempts.filter(({ examSession }) => examSession?.isOnline).length
    const disconnected = schedule.attempts.filter(({ status, examSession }) => status === 'IN_PROGRESS' && examSession && !examSession.isOnline).length
    const participantCount = schedule.scheduleCourses.reduce((sum, item) => sum + item.courseOffering._count.enrollments, 0)
    const recentViolationRows = schedule.attempts
      .flatMap((attempt) => attempt.violations.map((violation) => ({ attempt, violation })))
      .sort((a, b) => b.violation.detectedAt.getTime() - a.violation.detectedAt.getTime())
      .slice(0, 8)

    const recentViolations = await Promise.all(recentViolationRows.map(async ({ attempt, violation }) => {
      const evidenceUrls = await Promise.all(violation.evidences.map(async (evidence) => {
        try {
          return evidence.storageProvider === 'LOCAL'
            ? getLocalViolationEvidenceUrl(evidence.objectName)
            : await getViolationEvidenceUrl(evidence.objectName)
        } catch (error) {
          logger.error('Failed to create admin violation evidence URL', {
            violationId: violation.id,
            objectName: evidence.objectName,
            error: error instanceof Error ? error.message : String(error),
          })
          return null
        }
      }))

      return {
        id: violation.id,
        studentCode: attempt.student.studentCode,
        studentName: attempt.student.user.fullName,
        type: violation.violationType,
        severity: violation.severity,
        description: violation.description,
        detectedAt: violation.detectedAt,
        evidenceCount: violation.evidences.length,
        evidenceUrls: evidenceUrls.filter((url): url is string => Boolean(url)),
      }
    }))

    return {
      id: schedule.id,
      scheduleName: schedule.title,
      examTitle: schedule.exam.title,
      subjectName: schedule.exam.subject.name,
      courseCode: formatCourseCodes(schedule.scheduleCourses),
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      participantCount,
      joined: schedule.attempts.length,
      online,
      inProgress,
      submitted,
      absent: Math.max(participantCount - new Set(schedule.attempts.map(({ studentId }) => studentId)).size, 0),
      disconnected,
      warnings: schedule.attempts.reduce((sum, attempt) => sum + attempt.violations.length, 0),
      answered: schedule.attempts.reduce((sum, attempt) => sum + attempt.studentAnswers.length, 0),
      recentViolations,
      status: computedStatus as Exclude<ExamScheduleStatus, 'DRAFT' | 'SCHEDULED'> | 'SCHEDULED',
    }
  }))
}

export async function getAdminReportsOverview() {
  const now = new Date()
  const schedules = await prisma.examSchedule.findMany({
    where: {
      status: { not: 'DRAFT' },
      endTime: { lte: now },
    },
    orderBy: { startTime: 'desc' },
    include: {
      exam: {
        include: {
          subject: { include: { department: true } },
          semester: true,
          examQuestions: { select: { id: true, title: true, orderIndex: true } },
        },
      },
      scheduleCourses: {
        include: {
          courseOffering: {
            include: {
              subject: true,
              semester: true,
              _count: { select: { enrollments: true } },
            },
          },
        },
      },
      attempts: {
        include: {
          violations: true,
          student: { include: { user: true } },
          courseOffering: true,
          studentAnswers: { select: { examQuestionId: true, isCorrect: true } },
        },
      },
    },
  })

  const rows = schedules.map((schedule) => {
    const participantCount = schedule.scheduleCourses.reduce((sum, item) => sum + item.courseOffering._count.enrollments, 0)
    const attempts = schedule.attempts
    const submittedAttempts = attempts.filter(({ status }) => SUBMITTED_STATUSES.includes(status))
    const scoredAttempts = attempts.filter(({ status, totalScore }) => SCORED_STATUSES.includes(status) && totalScore !== null)
    const scores = scoredAttempts.map(({ totalScore }) => toNumber(totalScore))
    const average = scores.length > 0 ? Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2)) : 0
    const highest = scores.length > 0 ? Math.max(...scores) : 0
    const lowest = scores.length > 0 ? Math.min(...scores) : 0
    const passed = scores.filter((score) => score >= 5).length
    const violations = attempts.reduce((sum, attempt) => sum + attempt.violations.length, 0)

    return {
      id: schedule.id,
      scheduleTitle: schedule.title,
      subject: schedule.exam.subject.name,
      subjectCode: schedule.exam.subject.code,
      departmentName: schedule.exam.subject.department.name,
      semesterCode: schedule.exam.semester.code,
      course: formatCourseCodes(schedule.scheduleCourses),
      participants: participantCount,
      joined: new Set(attempts.map(({ studentId }) => studentId)).size,
      submitted: submittedAttempts.length,
      absent: Math.max(participantCount - new Set(attempts.map(({ studentId }) => studentId)).size, 0),
      average,
      highest,
      lowest,
      passedRate: passRate(passed, scores.length),
      violations,
      startTime: schedule.startTime,
      status: computeScheduleStatus(schedule.status, schedule.startTime, schedule.endTime),
    }
  })

  const totalParticipants = rows.reduce((sum, row) => sum + row.participants, 0)
  const totalSubmitted = rows.reduce((sum, row) => sum + row.submitted, 0)
  const scoreRows = rows.filter((row) => row.average > 0)
  const averageScore = scoreRows.length > 0
    ? Number((scoreRows.reduce((sum, row) => sum + row.average, 0) / scoreRows.length).toFixed(2))
    : 0

  const distribution = [
    { range: '0-4.9', count: 0 },
    { range: '5-6.9', count: 0 },
    { range: '7-8.4', count: 0 },
    { range: '8.5-10', count: 0 },
  ]

  schedules.forEach((schedule) => {
    schedule.attempts.forEach(({ totalScore, status }) => {
      if (!SCORED_STATUSES.includes(status) || totalScore === null) return
      const score = toNumber(totalScore)
      if (score < 5) distribution[0].count += 1
      else if (score < 7) distribution[1].count += 1
      else if (score < 8.5) distribution[2].count += 1
      else distribution[3].count += 1
    })
  })

  const questionStats = new Map<string, {
    id: string
    title: string
    scheduleTitle: string
    subject: string
    correct: number
    answered: number
  }>()
  const reviewAttempts: Array<{
    id: string
    scheduleTitle: string
    studentCode: string
    studentName: string
    courseCode: string
    score: number | null
    violationCount: number
    submittedAt: Date | null
    reason: string
  }> = []

  schedules.forEach((schedule) => {
    schedule.exam.examQuestions.forEach((question) => {
      questionStats.set(`${schedule.id}:${question.id}`, {
        id: question.id,
        title: question.title || `Câu ${question.orderIndex}`,
        scheduleTitle: schedule.title,
        subject: schedule.exam.subject.name,
        correct: 0,
        answered: 0,
      })
    })

    schedule.attempts.forEach((attempt) => {
      attempt.studentAnswers.forEach((answer) => {
        const stat = questionStats.get(`${schedule.id}:${answer.examQuestionId}`)
        if (!stat || answer.isCorrect === null) return
        stat.answered += 1
        if (answer.isCorrect) stat.correct += 1
      })

      if (attempt.violations.length > 0 || attempt.invalidatedAt) {
        reviewAttempts.push({
          id: attempt.id,
          scheduleTitle: schedule.title,
          studentCode: attempt.student.studentCode,
          studentName: attempt.student.user.fullName,
          courseCode: attempt.courseOffering.code,
          score: attempt.totalScore === null ? null : toNumber(attempt.totalScore),
          violationCount: attempt.violations.length,
          submittedAt: attempt.submittedAt,
          reason: attempt.invalidatedAt ? 'Bài thi đã bị đánh dấu không hợp lệ' : 'Có cảnh báo vi phạm trong ca thi',
        })
      }
    })
  })

  const lowCorrectQuestions = Array.from(questionStats.values())
    .filter((item) => item.answered >= 3)
    .map((item) => ({
      ...item,
      correctRate: passRate(item.correct, item.answered),
    }))
    .filter((item) => item.correctRate < 50)
    .sort((a, b) => a.correctRate - b.correctRate)
    .slice(0, 10)

  return {
    kpis: {
      schedules: rows.length,
      submissionRate: passRate(totalSubmitted, totalParticipants),
      averageScore,
      violations: rows.reduce((sum, row) => sum + row.violations, 0),
    },
    distribution,
    lowCorrectQuestions,
    reviewAttempts: reviewAttempts
      .sort((a, b) => b.violationCount - a.violationCount)
      .slice(0, 12),
    rows,
  }
}
