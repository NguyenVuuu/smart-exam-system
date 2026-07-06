import { Prisma } from '@prisma/client'
import prisma from '../../../lib/prisma'

export async function findStudentById(studentId: string) {
  return prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      user: { select: { fullName: true } },
    },
  })
}

export async function findEnrollmentsWithExams(studentId: string) {
  return prisma.enrollment.findMany({
    where: { studentId },
    select: {
      courseOffering: {
        select: {
          subject: { select: { id: true, name: true } },
          semester: { select: { id: true, name: true } },
          exams: {
            select: {
              id: true,
              title: true,
              type: true,
              startTime: true,
              endTime: true,
              durationMinutes: true,
              status: true,
            },
          },
        },
      },
    },
  })
}

export async function findSubmittedAttempts(studentId: string) {
  return prisma.examAttempt.findMany({
    where: {
      studentId,
      status: 'SUBMITTED',
      totalScore: { not: null },
    },
    select: {
      totalScore: true,
      exam: {
        select: {
          id: true,
          type: true,
          courseOffering: {
            select: {
              subject: { select: { id: true, name: true } },
              semester: { select: { id: true, name: true } },
            },
          },
          examQuestions: { select: { points: true } },
        },
      },
    },
  })
}

// Key: examId → average normalised score across all submitted students
export async function findClassAveragesByExam(
  examIds: string[],
): Promise<Map<string, number>> {
  if (examIds.length === 0) return new Map()

  const attempts = await prisma.examAttempt.findMany({
    where: {
      examId: { in: examIds },
      status: 'SUBMITTED',
      totalScore: { not: null },
    },
    select: {
      examId: true,
      totalScore: true,
      exam: {
        select: {
          examQuestions: { select: { points: true } },
        },
      },
    },
  })

  const scoresByExam = new Map<string, number[]>()
  for (const a of attempts) {
    const totalPoints = a.exam.examQuestions.reduce((s, eq) => s + Number(eq.points), 0)
    if (totalPoints === 0) continue
    const normalised = (Number(a.totalScore) / totalPoints) * 10
    if (!scoresByExam.has(a.examId)) scoresByExam.set(a.examId, [])
    scoresByExam.get(a.examId)!.push(normalised)
  }

  const result = new Map<string, number>()
  for (const [examId, scores] of scoresByExam) {
    result.set(examId, scores.reduce((s, v) => s + v, 0) / scores.length)
  }
  return result
}

export async function findNotifications(userId: string, limit = 10) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      title: true,
      content: true,
      isRead: true,
      createdAt: true,
    },
  })
}

// Kept for upcoming exams — needs subject name via courseOffering
export type EnrollmentExamRow = Prisma.EnrollmentGetPayload<{
  select: {
    courseOffering: {
      select: {
        subject: { select: { id: true; name: true } }
        semester: { select: { id: true; name: true } }
        exams: {
          select: {
            id: true
            title: true
            type: true
            startTime: true
            endTime: true
            durationMinutes: true
            status: true
          }
        }
      }
    }
  }
}>
