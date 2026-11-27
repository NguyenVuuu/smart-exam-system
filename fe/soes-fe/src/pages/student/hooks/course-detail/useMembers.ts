import { useState } from 'react'
import { useAccountQuery } from '../../../../hooks/useAccountQuery'
import { getMembers } from '../../api/student-course-detail.api'

const PAGE_SIZE = 20
const INITIAL_PAGINATION = { page: 1, pageSize: PAGE_SIZE, totalItems: 0, totalPages: 0 }

export function useMembers(courseOfferingId: string) {
  const [page, setPage] = useState(1)
  const query = useAccountQuery(['useMembers', courseOfferingId, page],
    () => getMembers(courseOfferingId, { page, pageSize: PAGE_SIZE }), Boolean(courseOfferingId))
  return {
    items: query.data?.items ?? [], pagination: query.data?.pagination ?? INITIAL_PAGINATION,
    isLoading: query.isFetching, error: query.isError ? 'Không thể tải danh sách thành viên.' : null,
    page, setPage,
  }
}
