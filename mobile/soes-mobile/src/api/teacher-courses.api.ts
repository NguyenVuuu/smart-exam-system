import { apiClient } from './client'
import type { DocumentPickerAsset } from 'expo-document-picker'
import { File, Directory, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { Platform } from 'react-native'
import type { ApiResponse } from '../types/auth.types'
import type { CourseDetail, CourseExam, CoursePost, CourseStudent, Page, TeacherCourse } from '../types/teacher-courses.types'
import { tokenStorage } from '../auth/tokenStorage'
import { displayFileName } from '../utils/courseFiles'

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
  form.append('materials', uploadPart(asset))
  await apiClient.post(`${root}/${courseId}/materials`, form,
    { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 })
}
function uploadPart(asset: DocumentPickerAsset): Blob {
  return asset.file ?? ({ uri: asset.uri, name: displayFileName(asset.name), type: asset.mimeType ?? 'application/octet-stream' } as unknown as Blob)
}
export async function deleteCourseMaterial(courseId: string, materialId: string) {
  await apiClient.delete(`${root}/${courseId}/materials/${materialId}`)
}
export async function setCourseMaterialAi(courseId: string, materialId: string, aiEnabled: boolean) {
  await apiClient.patch(`${root}/${courseId}/materials/${materialId}/ai`, { aiEnabled })
}
async function downloadCourseFile(path: string, fileName: string) {
  const name = displayFileName(fileName)
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
  const file = await File.downloadFileAsync(`${apiClient.defaults.baseURL}${path}`, new File(folder, name),
    { headers: { Authorization: `Bearer ${token}` }, idempotent: true })
  await Sharing.shareAsync(file.uri)
}
export const downloadCourseMaterial = (courseId: string, materialId: string, fileName: string) =>
  downloadCourseFile(`${root}/${courseId}/materials/${materialId}`, fileName)
export const downloadPostAttachment = (courseId: string, postId: string, attachmentId: string, fileName: string) =>
  downloadCourseFile(`${root}/${courseId}/posts/${postId}/attachments/${attachmentId}`, fileName)
export async function listStudents(id: string, page: number) {
  const { data } = await apiClient.get<ApiResponse<Page<CourseStudent>>>(`${root}/${id}/students`, { params: { page, pageSize: 20 } })
  return data.data
}
export async function listExams(id: string, page: number) {
  const { data } = await apiClient.get<ApiResponse<Page<CourseExam>>>(`${root}/${id}/exams`, { params: { page, pageSize: 20 } })
  return data.data
}

function postForm(title: string, content: string, status: 'DRAFT' | 'PUBLISHED', attachments: DocumentPickerAsset[], removedAttachmentIds: string[]) {
  const form = new FormData()
  form.append('title', title.trim())
  form.append('content', content.trim())
  form.append('status', status)
  attachments.forEach((asset) => form.append('attachments', uploadPart(asset)))
  if (removedAttachmentIds.length) form.append('removedAttachmentIds', JSON.stringify(removedAttachmentIds))
  return form
}

export async function savePost(courseId: string, postId: string | null, title: string, content: string,
  attachments: DocumentPickerAsset[] = [], removedAttachmentIds: string[] = [], status: 'DRAFT' | 'PUBLISHED' = 'PUBLISHED') {
  const path = `${root}/${courseId}/posts${postId ? `/${postId}` : ''}`
  const form = postForm(title, content, status, attachments, removedAttachmentIds)
  const options = { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 }
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
