import { apiClient } from '../../../api/axios'
import type { QuestionPayload, TeacherQuestionDto, TeacherSubjectOption } from '../types/teacher-question-api.types'

interface ApiResponse<T> { success: boolean; data: T }
interface QuestionList {
  items: TeacherQuestionDto[]
  pagination: { page: number; totalPages: number }
}

async function listPage(scope: 'PERSONAL' | 'SHARED', archived: boolean, page: number) {
  const response = await apiClient.get<ApiResponse<QuestionList>>('/teacher/questions', {
    params: { scope, archived: String(archived), page, pageSize: 100 },
  })
  return response.data.data
}

async function listAll(scope: 'PERSONAL' | 'SHARED', archived = false) {
  const first = await listPage(scope, archived, 1)
  const remaining = await Promise.all(
    Array.from({ length: Math.max(0, first.pagination.totalPages - 1) }, (_, index) =>
      listPage(scope, archived, index + 2)),
  )
  return [first, ...remaining].flatMap(({ items }) => items)
}

export const getPersonalQuestions = () => listAll('PERSONAL')
export const getArchivedQuestions = () => listAll('PERSONAL', true)
export const getSharedQuestions = () => listAll('SHARED')

export async function getQuestionSubjects() {
  const response = await apiClient.get<ApiResponse<TeacherSubjectOption[]>>('/teacher/question-subjects')
  return response.data.data
}

export async function createQuestion(payload: QuestionPayload) {
  const response = await apiClient.post<ApiResponse<TeacherQuestionDto>>('/teacher/questions', payload)
  return response.data.data
}

export async function updateQuestion(id: string, payload: QuestionPayload) {
  const response = await apiClient.put<ApiResponse<TeacherQuestionDto>>(`/teacher/questions/${id}`, payload)
  return response.data.data
}

const postAction = (path: string, data?: unknown) => apiClient.post(path, data)

export const shareQuestion = (id: string) => postAction(`/teacher/questions/${id}/share`)
export const archiveQuestion = (id: string) => postAction(`/teacher/questions/${id}/archive`)
export const restoreQuestion = (id: string) => postAction(`/teacher/questions/${id}/restore`)
export const removeSharedQuestion = (itemId: string, reason: string) =>
  postAction(`/teacher/question-approvals/${itemId}/remove`, { reason })
export async function uploadQuestionImage(file: Blob, fileName: string) {
  const form = new FormData()
  form.append('file', file, fileName)
  const response = await apiClient.post<ApiResponse<{ location: string }>>('/teacher/question-images', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data.data.location
}

export async function uploadImagesInHtml(html: string): Promise<string> {
  if (!html) return html

  const document = new DOMParser().parseFromString(html, 'text/html')
  const images = Array.from(document.body.querySelectorAll<HTMLImageElement>('img[src^="data:image/"]'))
  const sources = [...new Set(images.map((image) => image.getAttribute('src')).filter((source): source is string => Boolean(source)))]

  try {
    const uploadedSources = await Promise.all(sources.map(async (dataUri) => {
      const res = await fetch(dataUri)
      const blob = await res.blob()
      const ext = blob.type.split('/')[1] || 'png'
      const fileName = `question-img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const location = await uploadQuestionImage(blob, fileName)
      return [dataUri, location] as const
    }))

    const locations = new Map(uploadedSources)
    images.forEach((image) => {
      const source = image.getAttribute('src')
      const location = source ? locations.get(source) : undefined
      if (location) image.setAttribute('src', location)
    })

    document.body.querySelectorAll<HTMLParagraphElement>('p').forEach((paragraph) => {
      const children = Array.from(paragraph.children)
      const containsOnlyImage = !paragraph.textContent?.trim()
        && children.length === 1
        && children[0] instanceof HTMLImageElement

      if (containsOnlyImage) {
        paragraph.style.display = 'inline-block'
        paragraph.style.margin = '0 12px 12px 0'
        paragraph.style.verticalAlign = 'top'
      }
    })

    return document.body.innerHTML
  } catch (err) {
    console.error('Error uploading image to Supabase:', err)
    throw new Error('Không thể tải hình ảnh trong đề bài lên hệ thống lưu trữ. Vui lòng thử lại.', { cause: err })
  }
}

export async function uploadAiSourceFiles(subjectId: string, files: File[]) {
  const form = new FormData()
  form.set('subjectId', subjectId)
  files.forEach((file) => form.append('files', file))
  const response = await apiClient.post<ApiResponse<Array<{
    fileName: string
    storagePath: string
    fileSize: number
    contentType: string
    checksum: string
  }>>>('/teacher/ai-source-files', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data.data
}

export async function getAiMaterials(subjectId: string) {
  const response = await apiClient.get<ApiResponse<import('../types/teacher-question-api.types').AiMaterialDto[]>>(
    '/teacher/ai-question-generation/materials',
    { params: { subjectId } },
  )
  return response.data.data
}

export async function getAiGenerationHistories() {
  const response = await apiClient.get<ApiResponse<
    import('../types/teacher-question-api.types').AiGenerationHistoryDto[]
  >>('/teacher/ai-question-generations')
  return response.data.data
}

export interface GenerateAiQuestionsPayload {
  subjectId: string
  sourceType: 'COURSE_MATERIAL' | 'UPLOAD_FILE'
  mode: 'GENERATE_FROM_MATERIAL' | 'EXTRACT_EXISTING_EXAM'
  materialIds: string[]
  sourceFiles: import('../types/teacher-question-api.types').AiSourceFileDto[]
  prompt: string
  questionCount?: number
  difficulty: 'AUTO' | 'EASY' | 'MEDIUM' | 'HARD'
}

export async function generateAiQuestions(payload: GenerateAiQuestionsPayload) {
  const response = await apiClient.post<ApiResponse<{
    historyId: string
    questions: import('../types/teacher-question-api.types').GeneratedQuestionDto[]
  }>>('/teacher/ai-question-generations', payload)
  return response.data.data
}

export async function saveApprovedAiQuestions(questions: Array<{
  generationId: string
  subjectId: string
  question: Omit<import('../types/teacher-question-api.types').GeneratedQuestionDto,
    'id' | 'status' | 'subjectId' | 'subjectName' | 'sourceMaterialName'>
}>) {
  const response = await apiClient.post<ApiResponse<{ count: number; questionIds: string[] }>>(
    '/teacher/ai-question-generations/questions',
    { questions },
  )
  return response.data.data
}
