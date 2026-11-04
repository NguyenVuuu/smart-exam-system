import { useCallback, useEffect, useRef, useState } from 'react'
import { getStudentSubjects } from '../api/student-subjects.api'
import type { Pagination, SemesterOption, SubjectCard } from '../types/subjects.types'

const PAGE_SIZE = 12
const DEBOUNCE_MS = 400

interface State {
  items: SubjectCard[]
  pagination: Pagination
  semesterOptions: SemesterOption[]
  currentSemesterId: string | null
  isLoading: boolean
  error: string | null
}

const INIT_PAGINATION: Pagination = { page: 1, pageSize: PAGE_SIZE, totalItems: 0, totalPages: 1 }

export function useStudentSubjects() {
  const [state, setState] = useState<State>({
    items: [], pagination: INIT_PAGINATION, semesterOptions: [],
    currentSemesterId: null, isLoading: true, error: null,
  })
  const [page, setPage] = useState(1)
  const [semesterId, setSemesterId] = useState<string | undefined>(undefined)
  const [keyword, setKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const fetchRef = useRef(0)

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedKeyword(keyword); setPage(1) }, DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [keyword])

  const onSemesterChange = useCallback((id: string) => { setSemesterId(id); setPage(1) }, [])

  const doFetch = useCallback((pg: number, sid: string | undefined, kw: string) => {
    const callId = ++fetchRef.current
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    getStudentSubjects({ page: pg, pageSize: PAGE_SIZE, semesterId: sid, keyword: kw || undefined })
      .then(data => {
        if (callId !== fetchRef.current) return
        setState({ items: data.items, pagination: data.pagination, semesterOptions: data.semesterOptions, currentSemesterId: data.currentSemesterId, isLoading: false, error: null })
        if (!sid && data.currentSemesterId) setSemesterId(data.currentSemesterId)
      })
      .catch(() => {
        if (callId !== fetchRef.current) return
        setState(prev => ({ ...prev, isLoading: false, error: 'Không thể tải danh sách môn học.' }))
      })
  }, [])

  useEffect(() => { doFetch(page, semesterId, debouncedKeyword) }, [page, semesterId, debouncedKeyword, doFetch])

  const retry = useCallback(() => doFetch(page, semesterId, debouncedKeyword), [doFetch, page, semesterId, debouncedKeyword])

  return { ...state, page, keyword, setKeyword, setPage, onSemesterChange, retry }
}
