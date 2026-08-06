import { useEffect, useRef, useState } from 'react'
import { getTimeline } from '../../api/student-course-detail.api'
import type { Pagination, TimelineItem } from '../../types/course-detail.types'

const PAGE_SIZE = 10

interface TimelineState {
  items: TimelineItem[]
  pagination: Pagination
  isLoading: boolean
  error: string | null
}

const INITIAL_PAGINATION: Pagination = {
  page: 1,
  pageSize: PAGE_SIZE,
  totalItems: 0,
  totalPages: 0,
}

export function useTimeline(courseOfferingId: string) {
  const [page, setPage] = useState(1)
  const [state, setState] = useState<TimelineState>({
    items: [],
    pagination: INITIAL_PAGINATION,
    isLoading: true,
    error: null,
  })

  const fetchRef = useRef(0)

  useEffect(() => {
    if (!courseOfferingId) return

    const callId = ++fetchRef.current
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    getTimeline(courseOfferingId, { page, pageSize: PAGE_SIZE })
      .then((data) => {
        if (callId !== fetchRef.current) return
        setState({ items: data.items, pagination: data.pagination, isLoading: false, error: null })
      })
      .catch(() => {
        if (callId !== fetchRef.current) return
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Không thể tải danh sách bài đăng.',
        }))
      })
  }, [courseOfferingId, page])

  return { ...state, page, setPage }
}
