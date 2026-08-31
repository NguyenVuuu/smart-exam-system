import { ExamAttempt, PrismaClient } from '@prisma/client'
import { SEED_MODE } from './seed.config'

function deterministicScore(studentId: string, scheduleId: string): number {
  let hash = 0
  for (const character of studentId + scheduleId) {
    hash = (hash * 31 + character.charCodeAt(0)) & 0xffffffff
  }
  return Math.round((6 + (Math.abs(hash) % 39) * 0.1) * 10) / 10
}

export async function seedExamAttempts(prisma: PrismaClient): Promise<ExamAttempt[]> {
  console.log(`Seeding Exam Attempts (mode: ${SEED_MODE})...`)

  const schedules = await prisma.examSchedule.findMany({
    where: { status: 'CLOSED' },
    include: {
      exam: { include: { examQuestions: { select: { points: true } } } },
      scheduleCourses: {
        include: {
          courseOffering: {
            include: { enrollments: { select: { studentId: true } } },
          },
        },
      },
    },
  })

  const attempts: ExamAttempt[] = []
  for (const schedule of schedules) {
    const totalPoints = schedule.exam.examQuestions.reduce(
      (total, question) => total + Number(question.points),
      0,
    )

    for (const scheduleCourse of schedule.scheduleCourses) {
      for (const enrollment of scheduleCourse.courseOffering.enrollments) {
        const uniqueKey = {
          examScheduleId_studentId_attemptNo: {
            examScheduleId: schedule.id,
            studentId: enrollment.studentId,
            attemptNo: 1,
          },
        }
        const existing = await prisma.examAttempt.findUnique({ where: uniqueKey })
        if (existing) {
          attempts.push(existing)
          continue
        }

        const normalizedScore = deterministicScore(enrollment.studentId, schedule.id)
        const score = Math.round((normalizedScore / 10) * totalPoints * 100) / 100
        const startedAt = new Date(schedule.startTime.getTime() + 2 * 60_000)
        const deadlineAt = new Date(startedAt.getTime() + schedule.durationMinutes * 60_000)
        const submittedAt = new Date(startedAt.getTime() + schedule.durationMinutes * 54_000)
        attempts.push(
          await prisma.examAttempt.create({
            data: {
              attemptNo: 1,
              startedAt,
              deadlineAt,
              submittedAt,
              lastSavedAt: submittedAt,
              endedBy: 'STUDENT',
              status: 'SUBMITTED',
              totalScore: score.toString(),
              autoScore: score.toString(),
              manualScore: '0',
              examScheduleId: schedule.id,
              courseOfferingId: scheduleCourse.courseOfferingId,
              studentId: enrollment.studentId,
            },
          }),
        )
      }
    }
  }

  console.log(`✓ Exam Attempts completed (${attempts.length})`)
  return attempts
}
