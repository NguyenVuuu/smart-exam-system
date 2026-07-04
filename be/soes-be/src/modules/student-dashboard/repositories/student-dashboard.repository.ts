import { Prisma } from '@prisma/client'
import prisma from '../../../lib/prisma'

// ── Raw query result types ─────────────────────────────────

export type EnrollmentWithSubject = Prisma.EnrollmentGetPayload<{
  select: {
    courseOffering: {
      select: {
        subject: { select: { id: true; name: true } }
        exams: {
          select: {
            id: true
            title: true
            startTime: true
            endTime: true
            durationMinutes: true
            status: true
            courseOffering: {
              select: { subject: { select: { name: true } } }
            }
          }
        }
      }
    }
  }
}>

export type ExamAttemptWithScore = Prisma.ExamAttemptGetPayload<{
  select: {
    totalScore: true
    exam: {
      select: {
        courseOffering: {
          select: { subject: { select: { id: true; name: true } } }
        }
        examQuestions: { select: { points: true } }
      }
    }
  }
}>

export async function findStudentById(studentId: string) {
  return prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      user: { select: { fullName: true } },
    },
  })
}

export async function findEnrollmentsWithSubjects(studentId: string) {
  return prisma.enrollment.findMany({
    where: { studentId },
    select: {
      courseOffering: {
        select: {
          subject: { select: { id: true, name: true } },
          exams: {
            select: {
              id: true,
              title: true,
              startTime: true,
              endTime: true,
              durationMinutes: true,
              status: true,
              courseOffering: {
                select: { subject: { select: { name: true } } },
              },
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
          courseOffering: {
            select: { subject: { select: { id: true, name: true } } },
          },
          examQuestions: { select: { points: true } },
        },
      },
    },
  })
}

export async function findClassAverages(subjectIds: string[]): Promise<
  Array<{ subjectId: string; subjectName: string; average: number }>
> {
  if (subjectIds.length === 0) return []

  // Aggregate average score per subject across all students' submitted attempts
  const result = await prisma.examAttempt.findMany({
    where: {
      status: 'SUBMITTED',
      totalScore: { not: null },
      exam: {
        courseOffering: { subjectId: { in: subjectIds } },
      },
    },
    select: {
      totalScore: true,
      exam: {
        select: {
          examQuestions: { select: { points: true } },
          courseOffering: {
            select: { subject: { select: { id: true, name: true } } },
          },
        },
      },
    },
  })

  // Group by subject and compute average normalised score (0–10)
  const map = new Map<string, { name: string; scores: number[] }>()

  for (const attempt of result) {
    const subject = attempt.exam.courseOffering.subject
    const totalPoints = attempt.exam.examQuestions.reduce(
      (sum, eq) => sum + Number(eq.points),
      0,
    )
    if (totalPoints === 0) continue

    const normalised = (Number(attempt.totalScore) / totalPoints) * 10

    if (!map.has(subject.id)) {
      map.set(subject.id, { name: subject.name, scores: [] })
    }
    map.get(subject.id)!.scores.push(normalised)
  }

  return Array.from(map.entries()).map(([subjectId, { name, scores }]) => ({
    subjectId,
    subjectName: name,
    average: scores.reduce((s, v) => s + v, 0) / scores.length,
  }))
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
