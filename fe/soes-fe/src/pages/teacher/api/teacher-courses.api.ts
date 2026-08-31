import { apiClient } from '../../../api/axios'
import type {
  ProctorAssignmentApiDto,
  CourseExamApiDto, CourseStudentApiDto, TeacherPage,
  TeacherCoursesResponse,
  TeacherCourseDetailApiDto,
  CourseGradebookApiDto,
} from '../types/teacher-course-api.types'

interface ApiResponse<T> { success: boolean; data: T }
type PostDto = TeacherCourseDetailApiDto['posts'][number]

export async function getTeacherCourses() {
  const response = await apiClient.get<ApiResponse<TeacherCoursesResponse>>('/teacher/course-offerings', {
    params: { page: 1, pageSize: 100 },
  })
  return response.data.data
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

type PostPayload = { title: string; content: string; attachments?: File[] }
const postFormData = ({ title, content, attachments = [] }: PostPayload) => {
  const form = new FormData()
  form.set('title', title); form.set('content', content); form.set('status', 'PUBLISHED')
  attachments.forEach((file) => form.append('attachments', file))
  return form
}

export const createCoursePost = async (courseId: string, payload: PostPayload) => {
  const response = await apiClient.post<ApiResponse<PostDto>>(`/teacher/course-offerings/${courseId}/posts`, postFormData(payload), {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data.data
}
export const updateCoursePost = async (courseId: string, postId: string, payload: PostPayload) => {
  const response = await apiClient.put<ApiResponse<PostDto>>(`/teacher/course-offerings/${courseId}/posts/${postId}`, postFormData(payload), {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data.data
}
export const pinCoursePost = (courseId: string, postId: string, isPinned: boolean) => apiClient
  .patch(`/teacher/course-offerings/${courseId}/posts/${postId}/pin`, { isPinned })
export const deleteCoursePost = (courseId: string, postId: string) => apiClient
  .delete(`/teacher/course-offerings/${courseId}/posts/${postId}`)
export async function downloadCoursePostAttachment(courseId: string, postId: string, attachmentId: string, fileName: string) {
  const response = await apiClient.get(
    `/teacher/course-offerings/${courseId}/posts/${postId}/attachments/${attachmentId}`,
    { responseType: 'blob' },
  )
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url; link.download = fileName; link.click()
  URL.revokeObjectURL(url)
}

export const getCourseStudents = (courseId: string, page: number, keyword = '') => apiClient
  .get<ApiResponse<TeacherPage<CourseStudentApiDto>>>(`/teacher/course-offerings/${courseId}/students`, {
    params: { page, pageSize: 10, keyword: keyword || undefined },
  }).then(({ data }) => data.data)

export const getCourseExams = (courseId: string, page: number) => apiClient
  .get<ApiResponse<TeacherPage<CourseExamApiDto>>>(`/teacher/course-offerings/${courseId}/exams`, {
    params: { page, pageSize: 6 },
  }).then(({ data }) => data.data)

export const getCourseGradebook = (courseId: string, page: number) => apiClient
  .get<ApiResponse<CourseGradebookApiDto>>(`/teacher/course-offerings/${courseId}/gradebook`, {
    params: { page, pageSize: 10 },
  }).then(({ data }) => data.data)
