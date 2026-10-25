import { apiClient } from '../../../api/axios'

interface ApiResponse<T> { success: boolean; data: T }
export interface BackofficeReviewGroup {
  id: string
  name: string
  status: 'ACTIVE' | 'INACTIVE'
  department: { id: string; code: string; name: string; status: 'ACTIVE' | 'INACTIVE' }
  members: Array<{
    teacherId: string
    joinedAt: string
    teacher: { teacherCode: string; position: 'LECTURER' | 'DEPARTMENT_HEAD'; status: 'ACTIVE' | 'INACTIVE'; user: { fullName: string; status: 'ACTIVE' | 'INACTIVE' } }
  }>
}
export interface ReviewDepartment {
  id: string
  code: string
  name: string
  status: 'ACTIVE' | 'INACTIVE'
  reviewGroup: { id: string } | null
}
export interface ReviewCandidate {
  id: string
  teacherCode: string
  position: 'LECTURER' | 'DEPARTMENT_HEAD'
  user: { fullName: string }
}

const root = '/admin/review-groups'
export async function listReviewGroups() {
  const response = await apiClient.get<ApiResponse<BackofficeReviewGroup[]>>(root)
  return response.data.data
}
export async function listReviewDepartments() {
  const response = await apiClient.get<ApiResponse<ReviewDepartment[]>>(`${root}/departments`)
  return response.data.data
}
export async function listReviewCandidates(groupId: string) {
  const response = await apiClient.get<ApiResponse<ReviewCandidate[]>>(`${root}/${groupId}/candidates`)
  return response.data.data
}
export async function createReviewGroup(departmentId: string, name: string, reason: string) {
  const response = await apiClient.post<ApiResponse<BackofficeReviewGroup>>(root, { departmentId, name, reason })
  return response.data.data
}
export const renameReviewGroup = (id: string, name: string, reason: string) => apiClient.patch(`${root}/${id}`, { name, reason })
export const setReviewGroupStatus = (id: string, status: 'ACTIVE' | 'INACTIVE', reason: string) => apiClient.patch(`${root}/${id}/status`, { status, reason })
export const addReviewGroupMember = (id: string, teacherId: string, reason: string) => apiClient.put(`${root}/${id}/members/${teacherId}`, { reason })
export const removeReviewGroupMember = (id: string, teacherId: string, reason: string) => apiClient.delete(`${root}/${id}/members/${teacherId}`, { data: { reason } })
