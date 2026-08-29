import { toPagination } from '../../../utils/pagination'
import * as repo from '../repositories/teacher-courses.repository'
import type { CourseCollectionQuery, TeacherCoursesQuery } from '../validators/teacher-courses.validator'
import { toProctorAssignmentDto, toTeacherCourseDto } from '../mappers/teacher-course.mapper'
import { NotFoundError } from '../../../errors/AppError'
import { toTeacherCourseDetailDto } from '../mappers/teacher-course.mapper'

export async function list(teacherId: string, query: TeacherCoursesQuery) {
  const [total, items] = await repo.listTeacherCourses(teacherId, query)
  return { items: items.map(toTeacherCourseDto), pagination: toPagination(query.page, query.pageSize, total) }
}

export async function listProctorAssignments(teacherId: string) {
  return (await repo.listProctorAssignments(teacherId)).map((row) => toProctorAssignmentDto(row, teacherId))
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
      endTime: examSchedule.endTime, status: examSchedule.status,
    })),
    pagination: toPagination(query.page, query.pageSize, total),
  }
}
