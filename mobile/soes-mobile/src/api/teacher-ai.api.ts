import type { DocumentPickerAsset } from 'expo-document-picker'
import { apiClient } from './client'
import type { ApiResponse } from '../types/auth.types'
import type { AiGenerationResult, AiMaterial, AiSourceFile, GenerateAiPayload, GeneratedQuestion } from '../types/teacher-ai.types'

export const listAiMaterials = async (subjectId: string) =>
  (await apiClient.get<ApiResponse<AiMaterial[]>>('/teacher/ai-question-generation/materials', { params: { subjectId } })).data.data

export async function uploadAiSource(asset: DocumentPickerAsset, subjectId: string) {
  const form = new FormData()
  form.append('subjectId', subjectId)
  form.append('files', asset.file ?? ({ uri: asset.uri, name: asset.name, type: asset.mimeType ?? 'application/octet-stream' } as unknown as Blob))
  const { data } = await apiClient.post<ApiResponse<AiSourceFile[]>>('/teacher/ai-source-files', form,
    { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 })
  return data.data[0]
}
export const generateAiQuestions = async (payload: GenerateAiPayload) =>
  (await apiClient.post<ApiResponse<AiGenerationResult>>('/teacher/ai-question-generations', payload, { timeout: 600000 })).data.data

export async function saveAiQuestions(historyId: string, subjectId: string, questions: GeneratedQuestion[]) {
  const approved = questions.map(({ id: _id, status: _status, subjectId: _subjectId, subjectName: _subjectName,
    sourceMaterialName: _sourceMaterialName, topicIds = [], ...question }) => ({ generationId: historyId, subjectId, topicIds, question }))
  const { data } = await apiClient.post<ApiResponse<{ count: number; questionIds: string[] }>>(
    '/teacher/ai-question-generations/questions', { questions: approved }, { timeout: 60000 })
  return data.data
}
