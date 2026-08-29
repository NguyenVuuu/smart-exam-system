import { useCallback, useEffect, useState } from 'react'
import * as api from '../api/teacher-questions.api'
import { toQuestion, toQuestionPayload } from '../mappers/teacher-question.mapper'
import type { Question } from '../types/teacher-question-bank.types'
import type { TeacherSubjectOption } from '../types/teacher-question-api.types'

export function useTeacherQuestions(mode: 'BANK' | 'AUDIT' = 'BANK') {
  const [questions, setQuestions] = useState<Question[]>([])
  const [subjects, setSubjects] = useState<TeacherSubjectOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [personal, archived, shared, subjectOptions] = await Promise.all([
        api.getPersonalQuestions(),
        mode === 'BANK' ? api.getArchivedQuestions() : Promise.resolve([]),
        mode === 'BANK' ? api.getSharedQuestions() : Promise.resolve([]),
        api.getQuestionSubjects(),
      ])
      const rows = [...personal, ...archived, ...shared].map(toQuestion)
      setQuestions(Array.from(new Map(rows.map((row) => [row.id, row])).values()))
      setSubjects(subjectOptions)
    } catch {
      setError('Không thể tải ngân hàng câu hỏi. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }, [mode])

  useEffect(() => { void Promise.resolve().then(load) }, [load])

  const mutate = async (action: () => Promise<unknown>) => {
    await action()
    await load()
  }

  return {
    questions, subjects, loading, error, retry: load,
    save: (data: Partial<Question>, id?: string) => mutate(() => id
      ? api.updateQuestion(id, toQuestionPayload(data))
      : api.createQuestion(toQuestionPayload(data))),
    share: (id: string) => mutate(() => api.shareQuestion(id)),
    archive: (id: string) => mutate(() => api.archiveQuestion(id)),
    restore: (id: string) => mutate(() => api.restoreQuestion(id)),
    removeShared: (itemId: string, reason: string) => mutate(() => api.removeSharedQuestion(itemId, reason)),
  }
}
