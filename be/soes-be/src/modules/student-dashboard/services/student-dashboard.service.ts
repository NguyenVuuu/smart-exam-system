import { NotFoundError } from '../../../errors/AppError'
import type { StudentDashboardDto } from '../dtos/student-dashboard.dto'
import {
  toAnalyticsItemDto,
  toNotificationDto,
  toUpcomingExamDto,
} from '../mappers/student-dashboard.mapper'
import * as repo from '../repositories/student-dashboard.repository'

const UPCOMING_EXAM_LIMIT = 5
const NOTIFICATION_LIMIT = 10

export async function getStudentDashboard(
  studentId: string,
  userId: string,
): Promise<StudentDashboardDto> {
  // Verify student exists
  const student = await repo.findStudentById(studentId)
  if (!student) throw new NotFoundError('Student not found')

  // Fetch all data in parallel
  const [enrollments, submittedAttempts, notifications] = await Promise.all([
    repo.findEnrollmentsWithSubjects(studentId),
    repo.findSubmittedAttempts(studentId),
    repo.findNotifications(userId, NOTIFICATION_LIMIT),
  ])

  // ── Greeting ──────────────────────────────────────────
  const greeting = { fullName: student.user.fullName }

  // ── Unique subjects from enrollments ─────────────────
  const subjectMap = new Map<string, string>() // id → name
  for (const enrollment of enrollments) {
    const subj = enrollment.courseOffering.subject
    subjectMap.set(subj.id, subj.name)
  }
  const subjectCount = subjectMap.size

  // ── All exams across enrollments ──────────────────────
  const allExams = enrollments.flatMap((e) => e.courseOffering.exams)

  const examCount = new Set(allExams.map((e) => e.id)).size

  // ── Upcoming exams (PUBLISHED, startTime in future) ───
  const now = new Date()
  const upcomingExams = allExams
    .filter((e) => e.status === 'PUBLISHED' && e.startTime > now)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    .slice(0, UPCOMING_EXAM_LIMIT)

  const upcomingExamCount = upcomingExams.length

  // ── GPA (average normalised score across all submitted attempts) ──
  let gpa: number | null = null
  if (submittedAttempts.length > 0) {
    const normalisedScores = submittedAttempts
      .map((attempt) => {
        const totalPoints = attempt.exam.examQuestions.reduce(
          (sum, eq) => sum + Number(eq.points),
          0,
        )
        if (totalPoints === 0) return null
        return (Number(attempt.totalScore) / totalPoints) * 10
      })
      .filter((s): s is number => s !== null)

    if (normalisedScores.length > 0) {
      const sum = normalisedScores.reduce((s, v) => s + v, 0)
      gpa = Math.round((sum / normalisedScores.length) * 100) / 100
    }
  }

  // ── Analytics: my score vs class average per subject ──
  const myScoreBySubject = new Map<string, { name: string; scores: number[] }>()
  for (const attempt of submittedAttempts) {
    const subj = attempt.exam.courseOffering.subject
    const totalPoints = attempt.exam.examQuestions.reduce(
      (sum, eq) => sum + Number(eq.points),
      0,
    )
    if (totalPoints === 0) continue

    const normalised = (Number(attempt.totalScore) / totalPoints) * 10
    if (!myScoreBySubject.has(subj.id)) {
      myScoreBySubject.set(subj.id, { name: subj.name, scores: [] })
    }
    myScoreBySubject.get(subj.id)!.scores.push(normalised)
  }

  const subjectIdsWithScores = Array.from(myScoreBySubject.keys())
  const classAverages = await repo.findClassAverages(subjectIdsWithScores)
  const classAvgMap = new Map(classAverages.map((c) => [c.subjectId, c]))

  const analytics = subjectIdsWithScores.map((subjectId) => {
    const { name, scores } = myScoreBySubject.get(subjectId)!
    const myAvg = scores.reduce((s, v) => s + v, 0) / scores.length
    const classAvg = classAvgMap.get(subjectId)?.average ?? myAvg
    return toAnalyticsItemDto(name, myAvg, classAvg)
  })

  return {
    greeting,
    stats: { subjectCount, examCount, gpa, upcomingExamCount },
    analytics,
    upcomingExams: upcomingExams.map(toUpcomingExamDto),
    notifications: notifications.map(toNotificationDto),
  }
}
