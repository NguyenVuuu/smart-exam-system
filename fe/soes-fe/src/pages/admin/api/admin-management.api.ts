import { apiClient } from '../../../api/axios'
import type {
  ApiPage, ApiResponse, CourseEnrollmentApiDto, CourseOfferingApiDto, CourseOfferingPayload,
  DepartmentApiDto, DepartmentPayload, SubjectApiDto, SubjectPayload,
  UpdateUserPayload, UserApiDto, UserPayload,
} from '../types/admin-api.types'

const unwrap = <T>(response: { data: ApiResponse<T> }) => response.data.data
const pageParams = { page: 1, pageSize: 100 }

async function getAllPages<T>(url: string, params: Record<string, unknown> = {}) {
  const first = await apiClient
    .get<ApiResponse<ApiPage<T>>>(url, { params: { ...pageParams, ...params } })
    .then(unwrap)
  if (first.pagination.totalPages <= 1) return first

  const remaining = await Promise.all(
    Array.from({ length: first.pagination.totalPages - 1 }, (_, index) => apiClient
      .get<ApiResponse<ApiPage<T>>>(url, {
        params: { ...pageParams, ...params, page: index + 2 },
      })
      .then(unwrap)),
  )
  const items = [first, ...remaining].flatMap((page) => page.items)
  return {
    items,
    pagination: { page: 1, pageSize: items.length, totalItems: items.length, totalPages: 1 },
  }
}

export const getDepartments = () => getAllPages<DepartmentApiDto>('/admin/departments')
export const saveDepartment = (id: string | null, payload: DepartmentPayload) => id
  ? apiClient.put<ApiResponse<DepartmentApiDto>>(`/admin/departments/${id}`, payload).then(unwrap)
  : apiClient.post<ApiResponse<DepartmentApiDto>>('/admin/departments', payload).then(unwrap)
export const assignDepartmentHead = (id: string, teacherId: string | null) => apiClient
  .patch<ApiResponse<unknown>>(`/admin/departments/${id}/head`, { teacherId }).then(unwrap)

export const getSubjects = () => getAllPages<SubjectApiDto>('/admin/subjects')
export const saveSubject = (id: string | null, payload: SubjectPayload) => id
  ? apiClient.put<ApiResponse<SubjectApiDto>>(`/admin/subjects/${id}`, payload).then(unwrap)
  : apiClient.post<ApiResponse<SubjectApiDto>>('/admin/subjects', payload).then(unwrap)

export const getCourseOfferings = (params: {
  keyword?: string; semesterId?: string; departmentId?: string; subjectId?: string; status?: 'ACTIVE' | 'CLOSED'
} = {}) => getAllPages<CourseOfferingApiDto>('/admin/course-offerings', params)
export const saveCourseOffering = (id: string | null, payload: CourseOfferingPayload) => id
  ? apiClient.put<ApiResponse<CourseOfferingApiDto>>(`/admin/course-offerings/${id}`, payload).then(unwrap)
  : apiClient.post<ApiResponse<CourseOfferingApiDto>>('/admin/course-offerings', payload).then(unwrap)

export const getUsers = () => getAllPages<UserApiDto>('/admin/users')
export const createUser = (payload: UserPayload) => apiClient
  .post<ApiResponse<unknown>>('/admin/users', payload).then(unwrap)
export const updateUser = (role: UserApiDto['role'], profileId: string, payload: UpdateUserPayload) => apiClient
  .put<ApiResponse<unknown>>(`/admin/users/${role}/${profileId}`, payload).then(unwrap)
export const setUserStatus = (role: UserApiDto['role'], profileId: string, status: 'ACTIVE' | 'INACTIVE') => apiClient
  .patch(`/admin/users/${role}/${profileId}/status`, { status })
export const resetUserPassword = (role: UserApiDto['role'], profileId: string) => apiClient
  .post(`/admin/users/${role}/${profileId}/reset-password`, { password: '123456' })

export const enrollStudents = (courseOfferingId: string, studentIds: string[]) => apiClient
  .post(`/admin/course-offerings/${courseOfferingId}/enrollments`, { studentIds })
export const getCourseEnrollments = (courseOfferingId: string) =>
  getAllPages<CourseEnrollmentApiDto>(`/admin/course-offerings/${courseOfferingId}/enrollments`)
export const withdrawStudent = (courseOfferingId: string, studentId: string) => apiClient
  .delete(`/admin/course-offerings/${courseOfferingId}/enrollments/${studentId}`)
