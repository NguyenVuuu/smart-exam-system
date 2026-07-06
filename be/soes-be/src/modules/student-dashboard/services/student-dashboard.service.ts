import { NotFoundError } from '../../../errors/AppError'
import type { ExamTypeValue, StudentDashboardDto } from '../dtos/student-dashboard.dto'
import { toAnalyticsItemDto, toNotificationDto, toUpcomingExamDto } from '../mappers/student-dashboard.mapper'
import * as repo from '../repositories/student-dashboard.repository'

const UPCOMING_EXAM_LIMIT = 5
const NOTIFICATION_LIMIT = 10

// Composite key for grouping analytics by subject+semester+examType
function groupKey(subjectId: string, semesterId: string, examType: string): string {
  return `${subjectId}::${semesterId}::${examType}`
}

export async function getStudentDashboard(
  studentId: string,
  userId: string,
): Promise<StudentDashboardDto> {
  const student = await repo.findStudentById(studentId)
  if (!student) throw new NotFoundError('Student not found')

  const [enrollments, submittedAttempts, notifications] = await Promise.all([
    repo.findEnrollmentsWithExams(studentId),
    repo.findSubmittedAttempts(studentId),
    repo.findNotifications(userId, NOTIFICATION_LIMIT),
  ])

  // ── Greeting ──────────────────────────────────────────
  const greeting = { fullName: student.user.fullName }

  // ── Unique subjects ────────────────────────────────────
  const subjectCount = new Set(
    enrollments.map((e) => e.courseOffering.subject.id),
  ).size

  // ── Total exam count ───────────────────────────────────
  const examCount = new Set(
    enrollments.flatMap((e) => e.courseOffering.exams.map((ex) => ex.id)),
  ).size

  // ── Upcoming exams ─────────────────────────────────────
  const now = new Date()
  interface UpcomingExamWithSubject {
    id: string; title: string; startTime: Date; endTime: Date
    durationMinutes: number; courseOffering: { subject: { name: string } }
  }
  const upcomingRaw: UpcomingExamWithSubject[] = []

  for (const enrollment of enrollments) {
    const co = enrollment.courseOffering
    for (const exam of co.exams) {
      if (exam.status === 'PUBLISHED' && exam.startTime > now) {
        upcomingRaw.push({ ...exam, courseOffering: { subject: { name: co.subject.name } } })
      }
    }
  }

  const upcomingExams = upcomingRaw
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    .slice(0, UPCOMING_EXAM_LIMIT)
    .map(toUpcomingExamDto)

  const upcomingExamCount = upcomingExams.length

  // ── GPA ────────────────────────────────────────────────
  const normalisedScores: number[] = []
  for (const attempt of submittedAttempts) {
    const totalPoints = attempt.exam.examQuestions.reduce((s, eq) => s + Number(eq.points), 0)
    if (totalPoints === 0) continue
    normalisedScores.push((Number(attempt.totalScore) / totalPoints) * 10)
  }
  const gpa =
    normalisedScores.length > 0
      ? Math.round((normalisedScores.reduce((s, v) => s + v, 0) / normalisedScores.length) * 100) / 100
      : null

  // ── Analytics: grouped by (subjectId, semesterId, examType) ───────────
  // For QUIZ: average all quiz scores for that subject+semester
  // For MIDTERM/FINAL: single score per group

  interface GroupInfo {
    subjectId: string
    subjectName: string
    semesterId: string
    semesterName: string
    examType: ExamTypeValue
    examIds: string[]         // all exam ids in this group (for class avg)
    myScores: number[]        // my normalised scores
  }

  const groupMap = new Map<string, GroupInfo>()

  for (const attempt of submittedAttempts) {
    const totalPoints = attempt.exam.examQuestions.reduce((s, eq) => s + Number(eq.points), 0)
    if (totalPoints === 0) continue

    const normalised = (Number(attempt.totalScore) / totalPoints) * 10
    const co = attempt.exam.courseOffering
    const examType = attempt.exam.type as ExamTypeValue
    const key = groupKey(co.subject.id, co.semester.id, examType)

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        subjectId: co.subject.id,
        subjectName: co.subject.name,
        semesterId: co.semester.id,
        semesterName: co.semester.name,
        examType,
        examIds: [],
        myScores: [],
      })
    }

    const group = groupMap.get(key)!
    group.myScores.push(normalised)
    group.examIds.push(attempt.exam.id)
  }

  // Fetch class averages for all relevant exam ids
  const allExamIds = Array.from(groupMap.values()).flatMap((g) => g.examIds)
  const classAvgByExam = await repo.findClassAveragesByExam(allExamIds)

  const analytics = Array.from(groupMap.values()).map((group) => {
    const myScore = group.myScores.reduce((s, v) => s + v, 0) / group.myScores.length

    // Class average: average of per-exam class averages in this group
    const groupClassAvgs = group.examIds
      .map((id) => classAvgByExam.get(id))
      .filter((v): v is number => v !== undefined)

    const classAverage =
      groupClassAvgs.length > 0
        ? groupClassAvgs.reduce((s, v) => s + v, 0) / groupClassAvgs.length
        : myScore

    return toAnalyticsItemDto({
      subjectId: group.subjectId,
      subjectName: group.subjectName,
      semesterId: group.semesterId,
      semesterName: group.semesterName,
      examType: group.examType,
      myScore,
      classAverage,
    })
  })

  return {
    greeting,
    stats: { subjectCount, examCount, gpa, upcomingExamCount },
    analytics,
    upcomingExams,
    notifications: notifications.map(toNotificationDto),
  }
}
