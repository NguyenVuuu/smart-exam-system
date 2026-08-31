import { useCallback, useEffect, useState } from 'react'
import { getTeacherProctorAssignments } from '../api/teacher-courses.api'
import type { ProctorAssignmentApiDto } from '../types/teacher-course-api.types'

export function useTeacherProctorAssignments() {
  const [assignments, setAssignments] = useState<ProctorAssignmentApiDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setAssignments(await getTeacherProctorAssignments())
    } catch {
      setError('Không thể tải lịch coi thi được phân công.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  return { assignments, loading, error, retry: load }
}
