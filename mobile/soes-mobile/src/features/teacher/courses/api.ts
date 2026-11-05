import { apiClient } from '../../../api/client'
import type { ApiResponse } from '../../../types/auth.types'
import type { CourseDetail, CourseExam, CourseStudent, Page, TeacherCourse } from './types'

const root = '/teacher/course-offerings'

export async function listCourses(page: number, keyword: string) {
  const { data } = await apiClient.get<ApiResponse<Page<TeacherCourse>>>(root, { params: { page, pageSize: 20, keyword: keyword || undefined } })
  return data.data
}
export async function getCourse(id: string) {
  const { data } = await apiClient.get<ApiResponse<CourseDetail>>(`${root}/${id}`)
  return data.data
}
export async function listStudents(id: string, page: number) {
  const { data } = await apiClient.get<ApiResponse<Page<CourseStudent>>>(`${root}/${id}/students`, { params: { page, pageSize: 20 } })
  return data.data
}
export async function listExams(id: string, page: number) {
  const { data } = await apiClient.get<ApiResponse<Page<CourseExam>>>(`${root}/${id}/exams`, { params: { page, pageSize: 20 } })
  return data.data
}
