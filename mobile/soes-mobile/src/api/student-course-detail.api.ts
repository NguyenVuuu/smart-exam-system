import { File, Directory, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { Platform } from 'react-native'
import { apiClient } from './client'
import { tokenStorage } from '../auth/tokenStorage'
import { displayFileName } from '../utils/courseFiles'
import type {
  CourseHeader,
  MaterialsResponse,
  MembersResponse,
  ScoresResponse,
  TimelineResponse,
} from '../types/course-detail.types'

interface ApiResponse<T> { success: boolean; message: string; data: T }

export async function getCourseHeader(courseOfferingId: string): Promise<CourseHeader> {
  const { data } = await apiClient.get<ApiResponse<CourseHeader>>(
    `/student/course-offerings/${courseOfferingId}`,
  )
  return data.data
}

export async function getTimeline(
  courseOfferingId: string,
  params: { page?: number; pageSize?: number } = {},
): Promise<TimelineResponse> {
  const { data } = await apiClient.get<ApiResponse<TimelineResponse>>(
    `/student/course-offerings/${courseOfferingId}/timeline`,
    { params },
  )
  return data.data
}

export async function getMembers(
  courseOfferingId: string,
  params: { page?: number; pageSize?: number } = {},
): Promise<MembersResponse> {
  const { data } = await apiClient.get<ApiResponse<MembersResponse>>(
    `/student/course-offerings/${courseOfferingId}/members`,
    { params },
  )
  return data.data
}

export async function getScores(courseOfferingId: string): Promise<ScoresResponse> {
  const { data } = await apiClient.get<ApiResponse<ScoresResponse>>(
    `/student/course-offerings/${courseOfferingId}/scores`,
  )
  return data.data
}

export async function getPostDetail(
  courseOfferingId: string,
  postId: string,
): Promise<import('../types/course-detail.types').PostDetail> {
  const { data } = await apiClient.get<ApiResponse<import('../types/course-detail.types').PostDetail>>(
    `/student/course-offerings/${courseOfferingId}/posts/${postId}`,
  )
  return data.data
}

export async function getExamDetail(
  courseOfferingId: string,
  scheduleId: string,
): Promise<import('../types/course-detail.types').ExamDetail> {
  const { data } = await apiClient.get<ApiResponse<import('../types/course-detail.types').ExamDetail>>(
    `/student/course-offerings/${courseOfferingId}/exam-schedules/${scheduleId}`,
  )
  return data.data
}

export async function getMaterials(courseOfferingId: string): Promise<MaterialsResponse> {
  const { data } = await apiClient.get<ApiResponse<MaterialsResponse>>(
    `/student/course-offerings/${courseOfferingId}/materials`,
  )
  return data.data
}

export async function downloadStudentMaterial(
  courseOfferingId: string,
  materialId: string,
  fileName: string,
): Promise<void> {
  const name = displayFileName(fileName)
  const path = `/student/course-offerings/${courseOfferingId}/materials/${materialId}`

  if (Platform.OS === 'web') {
    const { data } = await apiClient.get<Blob>(path, { responseType: 'blob' })
    const url = URL.createObjectURL(data)
    const link = document.createElement('a')
    link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url)
    return
  }

  const token = await tokenStorage.getAccessToken()
  if (!token) throw new Error('Missing access token')

  const folder = new Directory(Paths.cache, 'soes-downloads')
  folder.create({ idempotent: true })

  const file = await File.downloadFileAsync(
    `${apiClient.defaults.baseURL}${path}`,
    new File(folder, name),
    { headers: { Authorization: `Bearer ${token}` }, idempotent: true },
  )
  await Sharing.shareAsync(file.uri)
}
