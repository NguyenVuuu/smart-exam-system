import { apiClient } from '../../../api/axios'
import type {
  CourseHeader,
  ExamDetail,
  MembersResponse,
  PostDetail,
  ScoresResponse,
  TimelineResponse,
} from '../types/course-detail.types'

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export async function getCourseHeader(courseOfferingId: string): Promise<CourseHeader> {
  const { data } = await apiClient.get<ApiResponse<CourseHeader>>(
    `/student/course-offerings/${courseOfferingId}`,
  )
  return data.data
}

export interface GetTimelineParams {
  page?: number
  pageSize?: number
}

export async function getTimeline(
  courseOfferingId: string,
  params: GetTimelineParams = {},
): Promise<TimelineResponse> {
  const { data } = await apiClient.get<ApiResponse<TimelineResponse>>(
    `/student/course-offerings/${courseOfferingId}/timeline`,
    { params },
  )
  return data.data
}

export async function getPostDetail(
  courseOfferingId: string,
  postId: string,
): Promise<PostDetail> {
  const { data } = await apiClient.get<ApiResponse<PostDetail>>(
    `/student/course-offerings/${courseOfferingId}/posts/${postId}`,
  )
  return data.data
}

export async function getExamDetail(
  courseOfferingId: string,
  examId: string,
): Promise<ExamDetail> {
  const { data } = await apiClient.get<ApiResponse<ExamDetail>>(
    `/student/course-offerings/${courseOfferingId}/exams/${examId}`,
  )
  return data.data
}

export interface GetMembersParams {
  page?: number
  pageSize?: number
}

export async function getMembers(
  courseOfferingId: string,
  params: GetMembersParams = {},
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
