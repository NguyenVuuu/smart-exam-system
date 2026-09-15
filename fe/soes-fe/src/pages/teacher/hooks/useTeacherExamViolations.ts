import { useCallback, useEffect, useState } from 'react'
import {
  getTeacherExamViolations,
  type TeacherPaginationMeta,
} from '../api/teacher-exams.api'
import type { ViolationRecord } from '../types/teacher-exam.types'

const PAGE_SIZE = 10
const emptyPagination: TeacherPaginationMeta = {
  page: 1,
  pageSize: PAGE_SIZE,
  totalItems: 0,
  totalPages: 1,
}

export function useTeacherExamViolations(examId: string, scheduleId: string) {
  const [pageBySchedule, setPageBySchedule] = useState({ scheduleId: '', page: 1 })
  const [requestVersion, setRequestVersion] = useState(0)
  const [result, setResult] = useState<{
    requestKey: string
    items: ViolationRecord[]
    pagination: TeacherPaginationMeta
    error: string | null
  }>({ requestKey: '', items: [], pagination: emptyPagination, error: null })
  const page = pageBySchedule.scheduleId === scheduleId ? pageBySchedule.page : 1
  const requestKey = `${examId}:${scheduleId}:${page}:${requestVersion}`

  useEffect(() => {
    if (!scheduleId) return

    let active = true
    void getTeacherExamViolations(examId, scheduleId, {
        page,
        pageSize: PAGE_SIZE,
      })
      .then((data) => {
        if (active) setResult({ requestKey, items: data.items, pagination: data.pagination, error: null })
      })
      .catch(() => {
        if (active) {
          setResult({
            requestKey,
            items: [],
            pagination: { ...emptyPagination, page },
            error: 'Không thể tải nhật ký vi phạm.',
          })
        }
      })

    return () => {
      active = false
    }
  }, [examId, page, requestKey, scheduleId])

  const setPage = useCallback((nextPage: number) => {
    setPageBySchedule({ scheduleId, page: nextPage })
  }, [scheduleId])

  const reload = useCallback(() => setRequestVersion((current) => current + 1), [])
  const hasCurrentResult = Boolean(scheduleId) && result.requestKey === requestKey
  return {
    items: hasCurrentResult ? result.items : [],
    pagination: hasCurrentResult ? result.pagination : { ...emptyPagination, page },
    loading: Boolean(scheduleId) && !hasCurrentResult,
    error: hasCurrentResult ? result.error : null,
    setPage,
    reload,
  }
}
