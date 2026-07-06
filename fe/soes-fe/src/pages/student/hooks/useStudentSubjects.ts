import { useCallback, useEffect, useRef, useState } from 'react'
import { getStudentSubjects } from '../api/student-subjects.api'
import type { Pagination, SemesterOption, SubjectCard } from '../types/subjects.types'

const PAGE_SIZE = 12
const DEBOUNCE_MS = 400

interface SubjectsState {
  items: SubjectCard[]
  pagination: Pagination
  semesterOptions: SemesterOption[]
  currentSemesterId: string | null
  isLoading: boolean
  error: string | null
}

const INITIAL_PAGINATION: Pagination = { page: 1, pageSize: PAGE_SIZE, totalItems: 0, totalPages: 1 }

export function useStudentSubjects() {
  const [state, setState] = useState<SubjectsState>({
    items: [],
    pagination: INITIAL_PAGINATION,
    semesterOptions: [],
    currentSemesterId: null,
    isLoading: true,
    error: null,
  })

  const [page, setPage] = useState(1)
  const [semesterId, setSemesterId] = useState<string | undefined>(undefined)
  const [keyword, setKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')

  // Debounce keyword
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword)
      setPage(1)
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [keyword])

  // Reset page when semester changes
  const handleSemesterChange = useCallback((id: string) => {
    setSemesterId(id)
    setPage(1)
  }, [])

  const fetchRef = useRef(0)

  useEffect(() => {
    const callId = ++fetchRef.current
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    getStudentSubjects({
      page,
      pageSize: PAGE_SIZE,
      semesterId,
      keyword: debouncedKeyword || undefined,
    })
      .then((data) => {
        if (callId !== fetchRef.current) return
        setState({
          items: data.items,
          pagination: data.pagination,
          semesterOptions: data.semesterOptions,
          currentSemesterId: data.currentSemesterId,
          isLoading: false,
          error: null,
        })
        // Sync semesterId with whatever the server resolved
        if (!semesterId && data.currentSemesterId) {
          setSemesterId(data.currentSemesterId)
        }
      })
      .catch(() => {
        if (callId !== fetchRef.current) return
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Không thể tải danh sách môn học. Vui lòng thử lại.',
        }))
      })
  }, [page, semesterId, debouncedKeyword]) // eslint-disable-line react-hooks/exhaustive-deps

  const retry = useCallback(() => {
    setState((prev) => ({ ...prev, error: null, isLoading: true }))
    fetchRef.current++ // force re-trigger
    setPage((p) => p) // no-op value change won't help — use a dedicated flag
    // Increment ref manually to re-trigger effect
    const callId = ++fetchRef.current
    getStudentSubjects({
      page,
      pageSize: PAGE_SIZE,
      semesterId,
      keyword: debouncedKeyword || undefined,
    })
      .then((data) => {
        if (callId !== fetchRef.current) return
        setState({
          items: data.items,
          pagination: data.pagination,
          semesterOptions: data.semesterOptions,
          currentSemesterId: data.currentSemesterId,
          isLoading: false,
          error: null,
        })
      })
      .catch(() => {
        if (callId !== fetchRef.current) return
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Không thể tải danh sách môn học. Vui lòng thử lại.',
        }))
      })
  }, [page, semesterId, debouncedKeyword])

  return {
    ...state,
    page,
    keyword,
    setKeyword,
    setPage,
    onSemesterChange: handleSemesterChange,
    retry,
  }
}
