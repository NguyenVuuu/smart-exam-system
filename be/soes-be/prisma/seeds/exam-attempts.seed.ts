import { ExamAttempt, PrismaClient } from '@prisma/client'
import { SEED_MODE } from './seed.config'

// Deterministic score: stable across re-runs, varies per student+exam
function deterministicScore(studentId: string, examId: string): number {
  let hash = 0
  const str = studentId + examId
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff
  }
  const steps = 38 // range 6.0–9.8 in 0.1 increments
  return Math.round((6.0 + (Math.abs(hash) % (steps + 1)) * 0.1) * 10) / 10
}

export async function seedExamAttempts(prisma: PrismaClient): Promise<ExamAttempt[]> {
  console.log(`Seeding Exam Attempts (mode: ${SEED_MODE})...`)

  // In demo mode all exams are CLOSED; in real mode only CLOSED exams get attempts
  const targetExams = await prisma.exam.findMany({
    where: { status: 'CLOSED' },
    include: {
      courseOffering: {
        include: { enrollments: { select: { studentId: true } } },
      },
      examQuestions: { select: { points: true } },
    },
  })

  const allAttempts: ExamAttempt[] = []

  for (const exam of targetExams) {
    const enrolledStudentIds = exam.courseOffering.enrollments.map((e) => e.studentId)
    const totalPoints = exam.examQuestions.reduce((s, eq) => s + Number(eq.points), 0)

    for (const studentId of enrolledStudentIds) {
      const existing = await prisma.examAttempt.findUnique({
        where: { examId_studentId_attemptNo: { examId: exam.id, studentId, attemptNo: 1 } },
      })
      if (existing) { allAttempts.push(existing); continue }

      const normalisedScore = deterministicScore(studentId, exam.id)
      const rawScore = Math.round((normalisedScore / 10) * totalPoints * 100) / 100

      const startedAt   = new Date(exam.startTime.getTime() + 2 * 60 * 1000)
      const submittedAt = new Date(startedAt.getTime() + exam.durationMinutes * 60 * 1000 * 0.9)

      const attempt = await prisma.examAttempt.create({
        data: {
          attemptNo:       1,
          startedAt,
          attemptEndAt:    submittedAt,
          submittedAt,
          remainingSeconds: 0,
          lastSavedAt:     submittedAt,
          endedBy:         'STUDENT',
          status:          'SUBMITTED',
          totalScore:      rawScore.toString(),
          autoScore:       rawScore.toString(),
          manualScore:     '0',
          examId:          exam.id,
          studentId,
        },
      })
      allAttempts.push(attempt)
    }
  }

  console.log(`✓ Exam Attempts completed (${allAttempts.length})`)
  return allAttempts
}
