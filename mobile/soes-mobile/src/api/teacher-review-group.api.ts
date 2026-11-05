import { apiClient } from './client'
import type { ApiResponse } from '../types/auth.types'
import type { ReviewGroup, ReviewGroupCandidate } from '../types/teacher-review-group.types'

const path = '/teacher/review-group'
export const getReviewGroup = async () => (await apiClient.get<ApiResponse<ReviewGroup>>(path)).data.data
export const listReviewGroupCandidates = async () => (await apiClient.get<ApiResponse<ReviewGroupCandidate[]>>(`${path}/candidates`)).data.data
export const createReviewGroup = (name: string) => apiClient.post(path, { name })
export const renameReviewGroup = (name: string) => apiClient.patch(path, { name })
export const setReviewGroupStatus = (status: ReviewGroup['status']) => apiClient.patch(`${path}/status`, { status })
export const addReviewGroupMember = (teacherId: string) => apiClient.put(`${path}/members/${teacherId}`)
export const removeReviewGroupMember = (teacherId: string) => apiClient.delete(`${path}/members/${teacherId}`)
