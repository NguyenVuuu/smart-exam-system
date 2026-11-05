import { useCallback, useEffect, useRef, useState } from 'react'
import { listInvigilation } from '../api/teacher-invigilation.api'
import type { InvigilationAssignment, InvigilationStatus } from '../types/teacher-invigilation.types'

export function useTeacherInvigilation() {
  const [items, setItems] = useState<InvigilationAssignment[]>([])
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<InvigilationStatus | 'ALL'>('ALL')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const requestId = useRef(0)

  const load = useCallback(async (nextPage: number, refresh = false) => {
    const id = ++requestId.current
    if (refresh) setRefreshing(true)
    else setLoading(true)
    try {
      const result = await listInvigilation(nextPage, keyword, status)
      if (id !== requestId.current) return
      setItems(result.items)
      setPage(nextPage)
      setTotalPages(result.pagination.totalPages)
      setError(false)
    } catch { if (id === requestId.current) setError(true) }
    finally { if (id === requestId.current) { setLoading(false); setRefreshing(false) } }
  }, [keyword, status])

  useEffect(() => {
    const timer = setTimeout(() => { void load(1) }, 250)
    return () => { clearTimeout(timer); requestId.current += 1 }
  }, [load])

  return { items, keyword, setKeyword, status, setStatus, page, totalPages, loading, refreshing, error,
    refresh: () => void load(page || 1, true), retry: () => void load(page || 1),
    goToPage: (nextPage: number) => { if (!loading && nextPage >= 1 && nextPage <= totalPages) void load(nextPage) } }
}
