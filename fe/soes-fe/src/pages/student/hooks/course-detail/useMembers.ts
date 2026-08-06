import { useEffect, useRef, useState } from 'react'
import { getMembers } from '../../api/student-course-detail.api'
import type { Member, Pagination } from '../../types/course-detail.types'

const PAGE_SIZE = 20

interface MembersState {
  items: Member[]
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

export function useMembers(courseOfferingId: string) {
  const [page, setPage] = useState(1)
  const [state, setState] = useState<MembersState>({
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

    getMembers(courseOfferingId, { page, pageSize: PAGE_SIZE })
      .then((data) => {
        if (callId !== fetchRef.current) return
        setState({ items: data.items, pagination: data.pagination, isLoading: false, error: null })
      })
      .catch(() => {
        if (callId !== fetchRef.current) return
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Không thể tải danh sách thành viên.',
        }))
      })
  }, [courseOfferingId, page])

  return { ...state, page, setPage }
}
