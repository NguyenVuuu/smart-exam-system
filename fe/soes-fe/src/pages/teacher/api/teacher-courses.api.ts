import { apiClient } from '../../../api/axios'
import type {
  ProctorAssignmentApiDto,
  CourseExamApiDto, CourseStudentApiDto, TeacherPage,
  TeacherCourseApiDto,
  TeacherCourseDetailApiDto,
} from '../types/teacher-course-api.types'

interface ApiResponse<T> { success: boolean; data: T }
type PostDto = TeacherCourseDetailApiDto['posts'][number]

export async function getTeacherCourses() {
  const response = await apiClient.get<ApiResponse<{ items: TeacherCourseApiDto[] }>>('/teacher/course-offerings', {
    params: { page: 1, pageSize: 100 },
  })
  return response.data.data.items
}

export async function getTeacherCourseDetail(id: string) {
  const response = await apiClient.get<ApiResponse<TeacherCourseDetailApiDto>>(
    `/teacher/course-offerings/${id}`,
  )
  return response.data.data
}

export async function getTeacherProctorAssignments() {
  const response = await apiClient.get<ApiResponse<ProctorAssignmentApiDto[]>>(
    '/teacher/proctor-assignments',
  )
  return response.data.data
}

export const createCoursePost = async (courseId: string, payload: { title: string; content: string }) => {
  const response = await apiClient.post<ApiResponse<PostDto>>(`/teacher/course-offerings/${courseId}/posts`, {
    ...payload, status: 'PUBLISHED',
  })
  return response.data.data
}
export const updateCoursePost = async (courseId: string, postId: string, payload: { title: string; content: string }) => {
  const response = await apiClient.put<ApiResponse<PostDto>>(`/teacher/course-offerings/${courseId}/posts/${postId}`, {
    ...payload, status: 'PUBLISHED',
  })
  return response.data.data
}
export const pinCoursePost = (courseId: string, postId: string, isPinned: boolean) => apiClient
  .patch(`/teacher/course-offerings/${courseId}/posts/${postId}/pin`, { isPinned })
export const deleteCoursePost = (courseId: string, postId: string) => apiClient
  .delete(`/teacher/course-offerings/${courseId}/posts/${postId}`)

export const getCourseStudents = (courseId: string, page: number, keyword = '') => apiClient
  .get<ApiResponse<TeacherPage<CourseStudentApiDto>>>(`/teacher/course-offerings/${courseId}/students`, {
    params: { page, pageSize: 10, keyword: keyword || undefined },
  }).then(({ data }) => data.data)

export const getCourseExams = (courseId: string, page: number) => apiClient
  .get<ApiResponse<TeacherPage<CourseExamApiDto>>>(`/teacher/course-offerings/${courseId}/exams`, {
    params: { page, pageSize: 6 },
  }).then(({ data }) => data.data)
