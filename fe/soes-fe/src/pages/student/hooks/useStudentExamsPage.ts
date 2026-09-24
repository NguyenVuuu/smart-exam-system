import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  getStudentExamSchedules,
  type StudentExamStatusCounts,
} from '../api/student-portal.api'
import { getStudentSubjects } from '../api/student-subjects.api'
import type { StudentExamFilter, StudentExamViewMode } from '../components/exams/student-exam.types'
import type { Pagination } from '../types/course-detail.types'
import type { SemesterOption } from '../types/subjects.types'

const PAGE_SIZE = 10
const CALENDAR_PAGE_SIZE = 100
const EMPTY_COUNTS: StudentExamStatusCounts = {
  OPEN: 0,
  UPCOMING: 0,
  COMPLETED: 0,
  EXPIRED: 0,
}

export function useStudentExamsPage() {
  const [exams, setExams] = useState<Awaited<ReturnType<typeof getStudentExamSchedules>>['items']>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: PAGE_SIZE, totalItems: 0, totalPages: 1 })
  const [statusCounts, setStatusCounts] = useState(EMPTY_COUNTS)
  const [semesterOptions, setSemesterOptions] = useState<SemesterOption[]>([])
  const [selectedSemesterId, setSelectedSemesterId] = useState('')
  const [semestersReady, setSemestersReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [filter, setFilter] = useState<StudentExamFilter>('ALL')
  const [page, setPage] = useState(1)
  const [requestedViewMode, setRequestedViewMode] = useState<StudentExamViewMode>('CALENDAR')
  const [displayViewMode, setDisplayViewMode] = useState<StudentExamViewMode>('CALENDAR')
  const requestId = useRef(0)
  const hasLoaded = useRef(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAppliedKeyword(keyword.trim())
      setPage(1)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [keyword])

  useEffect(() => {
    let cancelled = false

    getStudentSubjects({ page: 1, pageSize: 1 })
      .then((data) => {
        if (cancelled) return
        setSemesterOptions(data.semesterOptions)
        setSelectedSemesterId(resolveInitialSemester(data.semesterOptions, data.currentSemesterId))
      })
      .catch(() => {
        if (!cancelled) setSemesterOptions([])
      })
      .finally(() => {
        if (!cancelled) setSemestersReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const load = useCallback(async () => {
    if (!semestersReady) return
    const currentRequest = ++requestId.current
    const isInitialLoad = !hasLoaded.current
    if (isInitialLoad) {
      setLoading(true)
      setError(null)
    }

    try {
      const data = await getStudentExamSchedules({
        page: requestedViewMode === 'LIST' ? page : 1,
        pageSize: requestedViewMode === 'LIST' ? PAGE_SIZE : CALENDAR_PAGE_SIZE,
        status: filter,
        semesterId: selectedSemesterId || undefined,
        keyword: appliedKeyword || undefined,
      })
      if (currentRequest !== requestId.current) return
      setExams(data.items)
      setPagination(data.pagination)
      setStatusCounts(data.statusCounts)
      setDisplayViewMode(requestedViewMode)
      hasLoaded.current = true
    } catch {
      if (currentRequest === requestId.current && isInitialLoad) {
        setError('Không thể tải danh sách bài thi.')
      }
    } finally {
      if (currentRequest === requestId.current && isInitialLoad) setLoading(false)
    }
  }, [appliedKeyword, filter, page, requestedViewMode, selectedSemesterId, semestersReady])

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const stats = useMemo(() => ({ ...statusCounts }), [statusCounts])

  const changeFilter = (value: StudentExamFilter) => {
    setFilter(value)
    setPage(1)
  }

  const changeViewMode = (mode: StudentExamViewMode) => {
    setRequestedViewMode(mode)
    setPage(1)
  }

  const changeSemester = (semesterId: string) => {
    setSelectedSemesterId(semesterId)
    setPage(1)
  }

  return {
    exams,
    pagination,
    stats,
    semesterOptions,
    selectedSemesterId,
    loading,
    error,
    keyword,
    filter,
    page,
    viewMode: displayViewMode,
    setKeyword,
    setPage,
    changeFilter,
    changeViewMode,
    changeSemester,
    reload: load,
  }
}

function resolveInitialSemester(options: SemesterOption[], currentSemesterId: string | null) {
  return currentSemesterId
    || options.find((semester) => semester.isCurrent)?.id
    || options[0]?.id
    || ''
}
