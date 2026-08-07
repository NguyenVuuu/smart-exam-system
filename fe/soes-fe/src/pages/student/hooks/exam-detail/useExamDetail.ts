import { useEffect, useRef, useState } from 'react'
import { getExamDetail } from '../../api/student-exam-detail.api'
import type { ExamDetail } from '../../types/exam-detail.types'

interface ExamDetailState {
  data: ExamDetail | null
  isLoading: boolean
  error: string | null
}

export function useExamDetail(courseOfferingId: string, examId: string) {
  const [state, setState] = useState<ExamDetailState>({
    data: null,
    isLoading: true,
    error: null,
  })

  const fetchRef = useRef(0)

  function fetch() {
    if (!courseOfferingId || !examId) return

    const callId = ++fetchRef.current
    setState({ data: null, isLoading: true, error: null })

    getExamDetail(courseOfferingId, examId)
      .then((data) => {
        if (callId !== fetchRef.current) return
        setState({ data, isLoading: false, error: null })
      })
      .catch(() => {
        if (callId !== fetchRef.current) return
        setState({ data: null, isLoading: false, error: 'Không thể tải thông tin bài thi.' })
      })
  }

  useEffect(() => {
    fetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseOfferingId, examId])

  return { ...state, refetch: fetch }
}
