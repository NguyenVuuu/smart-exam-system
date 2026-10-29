import { apiClient } from '../../../api/axios'

interface ApiResponse<T> { success: boolean; data: T }

export interface ReviewGroupMember {
  teacherId: string
  joinedAt: string
  teacher: {
    teacherCode: string
    status: 'ACTIVE' | 'INACTIVE'
    user: { fullName: string; status: 'ACTIVE' | 'INACTIVE' }
  }
}

export interface ReviewGroup {
  id: string
  name: string
  status: 'ACTIVE' | 'INACTIVE'
  canManage: boolean
  department: { id: string; code: string; name: string }
  members: ReviewGroupMember[]
}

export interface ReviewGroupCandidate {
  id: string
  teacherCode: string
  position: 'LECTURER' | 'DEPARTMENT_HEAD'
  user: { fullName: string }
}

const path = '/teacher/review-group'

export interface ReviewGroupAccess {
  canViewGroup: boolean
  canReview: boolean
}

export async function getReviewGroupAccess() {
  const response = await apiClient.get<ApiResponse<ReviewGroupAccess>>(`${path}/access`)
  return response.data.data
}

export async function getReviewGroup() {
  const response = await apiClient.get<ApiResponse<ReviewGroup>>(path)
  return response.data.data
}

export async function listReviewGroupCandidates() {
  const response = await apiClient.get<ApiResponse<ReviewGroupCandidate[]>>(`${path}/candidates`)
  return response.data.data
}

export const createReviewGroup = (name: string) => apiClient.post(path, { name })
export const renameReviewGroup = (name: string) => apiClient.patch(path, { name })
export const setReviewGroupStatus = (status: 'ACTIVE' | 'INACTIVE') => apiClient.patch(`${path}/status`, { status })
export const addReviewGroupMember = (teacherId: string) => apiClient.put(`${path}/members/${teacherId}`)
export const removeReviewGroupMember = (teacherId: string) => apiClient.delete(`${path}/members/${teacherId}`)
