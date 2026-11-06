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

async function getAllPages<T>(path: string, params: Record<string, string | number>) {
  const first = unwrap(await apiClient.get<ApiResponse<ApiPage<T>>>(path, { params }))
  if (first.pagination.totalPages <= 1) return first.items
  const remaining = await Promise.all(
    Array.from({ length: first.pagination.totalPages - 1 }, (_, index) =>
      apiClient.get<ApiResponse<ApiPage<T>>>(path, { params: { ...params, page: index + 2 } }).then(unwrap),
    ),
  )
  return [first, ...remaining].flatMap((page) => page.items)
}

export async function getScheduleWorkspace(scheduleParams: ScheduleListParams) {
  const params = { page: 1, pageSize: 100 }
  const [schedules, exams, departments, subjects, courses, teachers, semesters] = await Promise.all([
    apiClient.get<ApiResponse<ApiPage<ExamScheduleApiDto>>>('/admin/exam-schedules', { params: scheduleParams }),
    apiClient.get<ApiResponse<ReadyFinalExamApiDto[]>>('/admin/exam-schedules/ready-final-exams'),
    getAllPages<DepartmentApiDto>('/admin/departments', { ...params, status: 'ACTIVE' }),
    getAllPages<SubjectApiDto>('/admin/subjects', { ...params, status: 'ACTIVE' }),
    getAllPages<CourseOfferingApiDto>('/admin/course-offerings', { ...params, status: 'ACTIVE' }),
    getAllPages<UserApiDto>('/admin/users/references', { ...params, role: 'TEACHER', status: 'ACTIVE' }),
    getAllPages<SemesterApiDto>('/admin/semesters', params),
  ])
  return {
    schedules: unwrap(schedules).items, pagination: unwrap(schedules).pagination,
    exams: unwrap(exams), departments,
    subjects, courses,
    teachers, semesters,
  }
}

export const createExamSchedule = (payload: SchedulePayload) =>
  apiClient.post<ApiResponse<ExamScheduleApiDto>>('/admin/exam-schedules', payload).then(unwrap)

export const updateExamSchedule = (id: string, payload: SchedulePayload) =>
  apiClient.put<ApiResponse<ExamScheduleApiDto>>(`/admin/exam-schedules/${id}`, payload).then(unwrap)

export const cancelExamSchedule = (id: string, reason: string) =>
  apiClient.post<ApiResponse<ExamScheduleApiDto>>(`/admin/exam-schedules/${id}/cancel`, { reason }).then(unwrap)
