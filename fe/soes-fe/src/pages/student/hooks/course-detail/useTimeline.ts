import { useState } from 'react'
import { useAccountQuery } from '../../../../hooks/useAccountQuery'
import { getTimeline } from '../../api/student-course-detail.api'

const PAGE_SIZE = 10
const INITIAL_PAGINATION = { page: 1, pageSize: PAGE_SIZE, totalItems: 0, totalPages: 0 }

export function useTimeline(courseOfferingId: string) {
  const [page, setPage] = useState(1)
  const query = useAccountQuery(['useTimeline', courseOfferingId, page],
    () => getTimeline(courseOfferingId, { page, pageSize: PAGE_SIZE }), Boolean(courseOfferingId))
  return {
    items: query.data?.items ?? [], pagination: query.data?.pagination ?? INITIAL_PAGINATION,
    isLoading: query.isFetching, error: query.isError ? 'Không thể tải danh sách bài đăng.' : null,
    page, setPage,
  }
}
