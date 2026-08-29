import type { Prisma } from '@prisma/client'
import type { ProctorAssignmentDto, TeacherCourseDetailDto, TeacherCourseDto, TeacherCoursePostDto } from '../dtos/teacher-course.dto'
import type { proctorAssignmentSelect, teacherCourseDetailInclude, teacherCourseInclude } from '../repositories/teacher-courses.repository'
import type { postInclude } from '../repositories/teacher-course-post.repository'
import { computeScheduleStatus } from '../../exam-schedules/mappers/exam-schedule.mapper'

type TeacherCourseRow = Prisma.CourseOfferingGetPayload<{ include: typeof teacherCourseInclude }>
type ProctorAssignmentRow = Prisma.ExamScheduleCourseGetPayload<{ select: typeof proctorAssignmentSelect }>
type TeacherCourseDetailRow = Prisma.CourseOfferingGetPayload<{ include: typeof teacherCourseDetailInclude }>
type PostRow = Prisma.PostGetPayload<{ include: typeof postInclude }>

export const toPostDto = (post: PostRow): TeacherCoursePostDto => ({
  id: post.id, title: post.title, content: post.content, status: post.status,
  publishedAt: post.publishedAt, createdAt: post.createdAt, isPinned: post.isPinned,
  teacherName: post.createdBy.user.fullName,
  attachments: post.attachments.map(({ id, fileName, fileSize }) => ({ id, fileName, fileSize })),
})

export function toTeacherCourseDto(row: TeacherCourseRow): TeacherCourseDto {
  return {
    id: row.id, code: row.code, status: row.status, semester: row.semester, subject: row.subject,
    enrollmentCount: row._count.enrollments, materialCount: row._count.materials,
    postCount: row._count.posts, scheduleCount: row._count.scheduleCourses,
  }
}

export function toTeacherCourseDetailDto(row: TeacherCourseDetailRow): TeacherCourseDetailDto {
  return {
    id: row.id, code: row.code, status: row.status, semester: row.semester, subject: row.subject,
    enrollmentCount: row._count.enrollments, materialCount: row._count.materials,
    postCount: row._count.posts, scheduleCount: row._count.scheduleCourses,
    maxCapacity: row.maxCapacity,
    teacher: { id: row.teacher.id, fullName: row.teacher.user.fullName },
    students: [],
    materials: row.materials.map((material) => ({
      id: material.id, fileName: material.fileName, fileSize: material.fileSize,
      contentType: material.contentType, aiEnabled: material.aiEnabled, createdAt: material.createdAt,
    })),
    posts: row.posts.map(toPostDto),
    exams: [],
  }
}

export function toProctorAssignmentDto(row: ProctorAssignmentRow, teacherId: string): ProctorAssignmentDto {
  const course = row.courseOffering
  const schedule = row.examSchedule
  return {
    id: row.id, scheduleId: schedule.id, title: schedule.title,
    startTime: schedule.startTime, endTime: schedule.endTime,
    status: computeScheduleStatus(schedule.status, schedule.startTime, schedule.endTime),
    source: row.proctors.some((item) => item.teacherId === teacherId) ? 'ASSIGNED' : 'CREATED',
    courseOffering: { id: course.id, code: course.code, subjectName: course.subject.name },
  }
}
