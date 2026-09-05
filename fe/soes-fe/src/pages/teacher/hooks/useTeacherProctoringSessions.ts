import { useCallback, useEffect, useState } from 'react'
import { getTeacherProctoringSessions } from '../api/teacher-exams.api'
import type { ProctoringSessionRecord } from '../types/teacher-exam.types'

const PROCTORING_REFRESH_MS = 10_000

export function useTeacherProctoringSessions(examId: string, scheduleId: string) {
  const [items, setItems] = useState<ProctoringSessionRecord[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!examId || !scheduleId) {
      setItems([])
      return
    }

    setLoading(true)
    try {
      setItems(await getTeacherProctoringSessions(examId, scheduleId))
    } finally {
      setLoading(false)
    }
  }, [examId, scheduleId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!examId || !scheduleId) return
    const intervalId = window.setInterval(() => void load(), PROCTORING_REFRESH_MS)
    return () => window.clearInterval(intervalId)
  }, [examId, load, scheduleId])

  return { items, loading, refresh: load }
}
