import { apiClient } from '../../../api/axios'
import type {
  AdminSystemSettings,
  CodeGenerationSettings,
  ExamDefaultsSettings,
  GeneralSettings,
} from '../types/admin-system-settings.types'

interface ApiResponse<T> {
  success: boolean
  data: T
}

export const getAdminSystemSettings = () =>
  apiClient.get<ApiResponse<AdminSystemSettings>>('/admin/system-settings')
    .then(({ data }) => data.data)

export const updateGeneralSettings = (payload: Partial<Omit<GeneralSettings, 'logoUrl'>>) =>
  apiClient.put<ApiResponse<GeneralSettings>>('/admin/system-settings/general', payload)
    .then(({ data }) => data.data)

export const uploadSystemLogo = (file: File) => {
  const form = new FormData()
  form.append('logo', file)
  return apiClient.post<ApiResponse<GeneralSettings>>('/admin/system-settings/logo', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(({ data }) => data.data)
}

export const removeSystemLogo = () =>
  apiClient.delete<ApiResponse<GeneralSettings>>('/admin/system-settings/logo')
    .then(({ data }) => data.data)

export const updateExamDefaultsSettings = (payload: Partial<ExamDefaultsSettings>) =>
  apiClient.put<ApiResponse<ExamDefaultsSettings>>('/admin/system-settings/exam-defaults', payload)
    .then(({ data }) => data.data)

export const updateCodeGenerationSettings = (payload: Partial<CodeGenerationSettings>) =>
  apiClient.put<ApiResponse<CodeGenerationSettings>>('/admin/system-settings/code-generation', payload)
    .then(({ data }) => data.data)

export const updateAiSettings = (payload: { model?: string; maxQuestionsPerRun?: number; timeoutSeconds?: number }) =>
  apiClient.put<ApiResponse<{ model: string; maxQuestionsPerRun: number; timeoutSeconds: number }>>('/admin/system-settings/ai', payload)
    .then(({ data }) => data.data)

export const resetDefaultSystemSettings = () =>
  apiClient.post<ApiResponse<AdminSystemSettings>>('/admin/system-settings/reset-defaults')
    .then(({ data }) => data.data)
