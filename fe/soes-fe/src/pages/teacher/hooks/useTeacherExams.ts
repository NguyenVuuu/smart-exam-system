import { useCallback, useEffect, useState } from 'react'
import * as api from '../api/teacher-exams.api'
import { toExam } from '../mappers/teacher-exam.mapper'
import type { Exam } from '../types/teacher-exam.types'

export function useTeacherExams() {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try { setExams((await api.getTeacherExams()).map(toExam)) }
    catch { setError('Không thể tải danh sách đề thi. Vui lòng thử lại.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void Promise.resolve().then(load) }, [load])

  return {
    exams, loading, error, retry: load,
    copy: async (id: string) => toExam(await api.copyTeacherExam(id)),
    remove: async (id: string) => { await api.deleteTeacherExam(id); await load() },
  }
}
