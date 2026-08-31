import type { CourseEnrollmentApiDto, CourseOfferingApiDto, DepartmentApiDto, SubjectApiDto, UserApiDto } from '../types/admin-api.types'
import type { AdminSubject, AdminUser, CourseEnrollmentAdmin, CourseOfferingAdmin, Department } from '../types/admin.types'

export const toDepartment = (dto: DepartmentApiDto): Department => ({
  id: dto.id, code: dto.code, name: dto.name, subjectCount: dto.subjectCount,
  headUserId: dto.head?.id, headName: dto.head?.fullName, headCode: dto.head?.code,
})

export const toSubject = (dto: SubjectApiDto): AdminSubject => ({
  id: dto.id, code: dto.code, name: dto.name, departmentId: dto.department.id,
  credits: dto.credits, courseCount: dto.courseOfferingCount ?? 0,
  status: dto.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
})

export const toCourseOffering = (dto: CourseOfferingApiDto): CourseOfferingAdmin => ({
  id: dto.id, subjectId: dto.subject.id, semesterId: dto.semester.id, teacherId: dto.teacher.id,
  code: dto.code, subjectCode: dto.subject.code, subjectName: dto.subject.name,
  semesterCode: dto.semester.code, teacherName: dto.teacher.fullName,
  enrolled: dto.enrollmentCount, capacity: dto.maxCapacity,
  status: dto.status === 'ACTIVE' ? 'OPEN' : 'CLOSED',
})

export const toCourseEnrollment = (dto: CourseEnrollmentApiDto): CourseEnrollmentAdmin => ({
  id: dto.id,
  code: dto.code,
  fullName: dto.fullName,
  email: dto.email ?? '',
  enrolledAt: new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(new Date(dto.enrolledAt)),
})

export const toAdminUser = (dto: UserApiDto): AdminUser => ({
  id: dto.profileId, profileId: dto.profileId, code: dto.code, fullName: dto.fullName,
  email: dto.email ?? '', phone: dto.phoneNumber ?? undefined, role: dto.role,
  departmentId: dto.department?.id, departmentName: dto.department?.name,
  position: dto.position === 'DEPARTMENT_HEAD' ? 'DEPARTMENT_HEAD' : dto.role === 'TEACHER' ? 'LECTURER' : undefined,
  status: dto.status === 'ACTIVE' ? 'ACTIVE' : 'LOCKED',
})
