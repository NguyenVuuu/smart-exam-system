import { useCallback, useEffect, useState } from 'react'
import { useAccountQuery } from '../../../hooks/useAccountQuery'
import { getStudentSubjects } from '../api/student-subjects.api'

const PAGE_SIZE = 12
const DEBOUNCE_MS = 400
const INITIAL_PAGINATION = { page: 1, pageSize: PAGE_SIZE, totalItems: 0, totalPages: 1 }

export function useStudentSubjects() {
  const [page, setPage] = useState(1)
  const [semesterId, setSemesterId] = useState<string | undefined>()
  const [keyword, setKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedKeyword(keyword); setPage(1) }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [keyword])

  const query = useAccountQuery(['student-subjects', page, semesterId, debouncedKeyword],
    () => getStudentSubjects({ page, pageSize: PAGE_SIZE, semesterId, keyword: debouncedKeyword || undefined }))
  if (!semesterId && query.data?.currentSemesterId) setSemesterId(query.data.currentSemesterId)

  const onSemesterChange = useCallback((id: string) => { setSemesterId(id); setPage(1) }, [])
  return {
    items: query.data?.items ?? [], pagination: query.data?.pagination ?? INITIAL_PAGINATION,
    semesterOptions: query.data?.semesterOptions ?? [], currentSemesterId: query.data?.currentSemesterId ?? null,
    isLoading: query.isFetching,
    error: query.isError ? 'Không thể tải danh sách môn học. Vui lòng thử lại.' : null,
    page, keyword, setKeyword, setPage, onSemesterChange, retry: query.reload,
  }
}
