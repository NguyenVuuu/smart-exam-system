import { apiClient } from './client'
import type { DocumentPickerAsset } from 'expo-document-picker'
import type { ApiResponse } from '../types/auth.types'
import type { CourseDetail, CourseExam, CoursePost, CourseStudent, Page, TeacherCourse } from '../types/teacher-courses.types'

const root = '/teacher/course-offerings'

export async function listCourses(page: number, keyword: string) {
  const { data } = await apiClient.get<ApiResponse<Page<TeacherCourse>>>(root, { params: { page, pageSize: 20, keyword: keyword || undefined } })
  return data.data
}
export async function getCourse(id: string) {
  const { data } = await apiClient.get<ApiResponse<CourseDetail>>(`${root}/${id}`)
  return data.data
}
export async function uploadCourseMaterial(courseId: string, asset: DocumentPickerAsset) {
  const form = new FormData()
  form.append('materials', asset.file ?? ({ uri: asset.uri, name: asset.name, type: asset.mimeType ?? 'application/octet-stream' } as unknown as Blob))
  await apiClient.post(`${root}/${courseId}/materials`, form,
    { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 })
}
export async function listStudents(id: string, page: number) {
  const { data } = await apiClient.get<ApiResponse<Page<CourseStudent>>>(`${root}/${id}/students`, { params: { page, pageSize: 20 } })
  return data.data
}
export async function listExams(id: string, page: number) {
  const { data } = await apiClient.get<ApiResponse<Page<CourseExam>>>(`${root}/${id}/exams`, { params: { page, pageSize: 20 } })
  return data.data
}

function postForm(title: string, content: string) {
  const form = new FormData()
  form.append('title', title.trim())
  form.append('content', content.trim())
  form.append('status', 'PUBLISHED')
  return form
}

export async function savePost(courseId: string, postId: string | null, title: string, content: string) {
  const path = `${root}/${courseId}/posts${postId ? `/${postId}` : ''}`
  const form = postForm(title, content)
  const options = { headers: { 'Content-Type': 'multipart/form-data' } }
  const { data } = postId ? await apiClient.put<ApiResponse<CoursePost>>(path, form, options) : await apiClient.post<ApiResponse<CoursePost>>(path, form, options)
  return data.data
}
export async function setPostPinned(courseId: string, postId: string, isPinned: boolean) {
  await apiClient.patch(`${root}/${courseId}/posts/${postId}/pin`, { isPinned })
}
export async function setPostStatus(courseId: string, postId: string, status: 'DRAFT' | 'PUBLISHED') {
  await apiClient.patch(`${root}/${courseId}/posts/${postId}/status`, { status })
}
export async function deletePost(courseId: string, postId: string) {
  await apiClient.delete(`${root}/${courseId}/posts/${postId}`)
}
