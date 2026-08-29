import { apiClient } from '../../../api/axios'
import type {
  ApiPage, ApiResponse, CourseOfferingApiDto, CourseOfferingPayload,
  DepartmentApiDto, DepartmentPayload, SubjectApiDto, SubjectPayload,
  UpdateUserPayload, UserApiDto, UserPayload,
} from '../types/admin-api.types'

const unwrap = <T>(response: { data: ApiResponse<T> }) => response.data.data
const pageParams = { page: 1, pageSize: 100 }

export const getDepartments = () => apiClient
  .get<ApiResponse<ApiPage<DepartmentApiDto>>>('/admin/departments', { params: pageParams }).then(unwrap)
export const saveDepartment = (id: string | null, payload: DepartmentPayload) => id
  ? apiClient.put<ApiResponse<DepartmentApiDto>>(`/admin/departments/${id}`, payload).then(unwrap)
  : apiClient.post<ApiResponse<DepartmentApiDto>>('/admin/departments', payload).then(unwrap)
export const assignDepartmentHead = (id: string, teacherId: string | null) => apiClient
  .patch<ApiResponse<unknown>>(`/admin/departments/${id}/head`, { teacherId }).then(unwrap)

export const getSubjects = () => apiClient
  .get<ApiResponse<ApiPage<SubjectApiDto>>>('/admin/subjects', { params: pageParams }).then(unwrap)
export const saveSubject = (id: string | null, payload: SubjectPayload) => id
  ? apiClient.put<ApiResponse<SubjectApiDto>>(`/admin/subjects/${id}`, payload).then(unwrap)
  : apiClient.post<ApiResponse<SubjectApiDto>>('/admin/subjects', payload).then(unwrap)

export const getCourseOfferings = () => apiClient
  .get<ApiResponse<ApiPage<CourseOfferingApiDto>>>('/admin/course-offerings', { params: pageParams }).then(unwrap)
export const saveCourseOffering = (id: string | null, payload: CourseOfferingPayload) => id
  ? apiClient.put<ApiResponse<CourseOfferingApiDto>>(`/admin/course-offerings/${id}`, payload).then(unwrap)
  : apiClient.post<ApiResponse<CourseOfferingApiDto>>('/admin/course-offerings', payload).then(unwrap)

export const getUsers = () => apiClient
  .get<ApiResponse<ApiPage<UserApiDto>>>('/admin/users', { params: pageParams }).then(unwrap)
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
