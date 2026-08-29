import { useCallback, useEffect, useState } from 'react'
import { getTeacherExam } from '../api/teacher-exams.api'
import { toExamDetail } from '../mappers/teacher-exam.mapper'
import type { Exam } from '../types/teacher-exam.types'

export function useTeacherExamDetail(id?: string) {
  const [exam, setExam] = useState<Exam | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) { setLoading(false); return }
    setLoading(true)
    setError(null)
    try { setExam(toExamDetail(await getTeacherExam(id))) }
    catch { setExam(null); setError('Đề thi không tồn tại hoặc bạn không có quyền truy cập.') }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { void load() }, [load])
  return { exam, loading, error, retry: load }
}
