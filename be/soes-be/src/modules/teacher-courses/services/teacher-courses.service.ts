import { toPagination } from '../../../utils/pagination'
import * as repo from '../repositories/teacher-courses.repository'
import type { CourseCollectionQuery, TeacherCoursesQuery } from '../validators/teacher-courses.validator'
import { toProctorAssignmentDto, toTeacherCourseDto } from '../mappers/teacher-course.mapper'
import { NotFoundError } from '../../../errors/AppError'
import { toTeacherCourseDetailDto } from '../mappers/teacher-course.mapper'
import { computeScheduleStatus } from '../../exam-schedules/mappers/exam-schedule.mapper'

export async function list(teacherId: string, query: TeacherCoursesQuery) {
  const [[total, items], semesters] = await Promise.all([
    repo.listTeacherCourses(teacherId, query),
    repo.listSemesterOptions(),
  ])
  return {
    items: items.map(toTeacherCourseDto),
    pagination: toPagination(query.page, query.pageSize, total),
    semesterOptions: semesters,
    currentSemesterId: semesters.find(({ status }) => status === 'ACTIVE')?.id ?? null,
  }
}

export async function listProctorAssignments(teacherId: string) {
  const { rows, teacherUserId } = await repo.listProctorAssignments(teacherId)
  return rows.map((row) => toProctorAssignmentDto(row, teacherId, teacherUserId))
}

export async function get(teacherId: string, courseOfferingId: string) {
  const course = await repo.findTeacherCourseDetail(teacherId, courseOfferingId)
  if (!course) throw new NotFoundError('Course offering not found')
  return toTeacherCourseDetailDto(course)
}

export async function listStudents(teacherId: string, courseOfferingId: string, query: CourseCollectionQuery) {
  const [total, rows] = await repo.listCourseStudents(teacherId, courseOfferingId, query)
  return {
    items: rows.map(({ id, student, enrolledAt }) => ({
      id, studentId: student.id, studentCode: student.studentCode,
      fullName: student.user.fullName, email: student.user.email, enrolledAt,
    })),
    pagination: toPagination(query.page, query.pageSize, total),
  }
}

export async function listExams(teacherId: string, courseOfferingId: string, query: CourseCollectionQuery) {
  const [total, rows] = await repo.listCourseExams(teacherId, courseOfferingId, query)
  return {
    items: rows.map(({ examSchedule }) => ({
      scheduleId: examSchedule.id, examId: examSchedule.exam.id, title: examSchedule.exam.title,
      totalPoints: Number(examSchedule.exam.totalPoints), startTime: examSchedule.startTime,
      endTime: examSchedule.endTime,
      status: computeScheduleStatus(examSchedule.status, examSchedule.startTime, examSchedule.endTime),
    })),
    pagination: toPagination(query.page, query.pageSize, total),
  }
}

export async function getGradebook(teacherId: string, courseOfferingId: string, query: CourseCollectionQuery) {
  const data = await repo.getCourseGradebook(teacherId, courseOfferingId, query)
  if (!data) throw new NotFoundError('Course offering not found')
  const attempts = new Map<string, number | null>()
  for (const attempt of data.attempts) {
    const key = `${attempt.studentId}:${attempt.examScheduleId}`
    if (!attempts.has(key)) attempts.set(key, attempt.totalScore === null ? null : Number(attempt.totalScore))
  }
  const maxScores = new Map(data.schedules.map(({ id, exam }) => [id, Number(exam.totalPoints)]))
  const students = data.enrollments.map(({ student }) => {
    const scores = Object.fromEntries(
      data.schedules.map(({ id }) => [id, attempts.get(`${student.id}:${id}`) ?? null]),
    )
    const normalized = Object.entries(scores).flatMap(([scheduleId, score]) => {
      const max = maxScores.get(scheduleId) ?? 0
      return score === null || !max ? [] : [(score / max) * 10]
    })
    return {
      studentId: student.id, studentCode: student.studentCode, fullName: student.user.fullName, scores,
      averageScore: normalized.length
        ? Number((normalized.reduce((sum, score) => sum + score, 0) / normalized.length).toFixed(2))
        : null,
    }
  })
  return {
    assessments: data.schedules.map(({ id, title, exam, resultsPublishedAt }) => ({
      scheduleId: id, title, type: exam.type, totalPoints: Number(exam.totalPoints),
      resultsPublished: Boolean(resultsPublishedAt),
    })),
    students,
    pagination: toPagination(query.page, query.pageSize, data.total),
  }
}
