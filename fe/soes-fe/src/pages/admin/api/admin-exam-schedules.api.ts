import { apiClient } from '../../../api/axios'
import type {
  ApiPage, ApiResponse, CourseOfferingApiDto, DepartmentApiDto, ExamScheduleApiDto,
  ReadyFinalExamApiDto, SchedulePayload, SemesterApiDto, SubjectApiDto, UserApiDto,
} from '../types/admin-api.types'

export interface ScheduleListParams {
  page: number; pageSize: number; keyword?: string; semesterId?: string
  departmentId?: string; subjectId?: string; status?: string
}

const unwrap = <T>({ data }: { data: ApiResponse<T> }) => data.data

export async function getScheduleWorkspace(scheduleParams: ScheduleListParams) {
  const params = { page: 1, pageSize: 100 }
  const [schedules, exams, departments, subjects, courses, teachers, semesters] = await Promise.all([
    apiClient.get<ApiResponse<ApiPage<ExamScheduleApiDto>>>('/admin/exam-schedules', { params: scheduleParams }),
    apiClient.get<ApiResponse<ReadyFinalExamApiDto[]>>('/admin/exam-schedules/ready-final-exams'),
    apiClient.get<ApiResponse<ApiPage<DepartmentApiDto>>>('/admin/departments', { params: { ...params, status: 'ACTIVE' } }),
    apiClient.get<ApiResponse<ApiPage<SubjectApiDto>>>('/admin/subjects', { params: { ...params, status: 'ACTIVE' } }),
    apiClient.get<ApiResponse<ApiPage<CourseOfferingApiDto>>>('/admin/course-offerings', { params: { ...params, status: 'ACTIVE' } }),
    apiClient.get<ApiResponse<ApiPage<UserApiDto>>>('/admin/users', { params: { ...params, role: 'TEACHER', status: 'ACTIVE' } }),
    apiClient.get<ApiResponse<ApiPage<SemesterApiDto>>>('/admin/semesters', { params }),
  ])
  return {
    schedules: unwrap(schedules).items, pagination: unwrap(schedules).pagination,
    exams: unwrap(exams), departments: unwrap(departments).items,
    subjects: unwrap(subjects).items, courses: unwrap(courses).items,
    teachers: unwrap(teachers).items, semesters: unwrap(semesters).items,
  }
}

export const createExamSchedule = (payload: SchedulePayload) =>
  apiClient.post<ApiResponse<ExamScheduleApiDto>>('/admin/exam-schedules', payload).then(unwrap)

export const updateExamSchedule = (id: string, payload: SchedulePayload) =>
  apiClient.put<ApiResponse<ExamScheduleApiDto>>(`/admin/exam-schedules/${id}`, payload).then(unwrap)

export const cancelExamSchedule = (id: string, reason: string) =>
  apiClient.post<ApiResponse<ExamScheduleApiDto>>(`/admin/exam-schedules/${id}/cancel`, { reason }).then(unwrap)
