import { useEffect, useRef, useState } from 'react'
import { getCourseHeader } from '../../api/student-course-detail.api'
import type { CourseHeader } from '../../types/course-detail.types'

interface CourseHeaderState {
  data: CourseHeader | null
  isLoading: boolean
  error: string | null
}

export function useCourseHeader(courseOfferingId: string) {
  const [state, setState] = useState<CourseHeaderState>({
    data: null,
    isLoading: true,
    error: null,
  })

  const fetchRef = useRef(0)

  useEffect(() => {
    if (!courseOfferingId) return

    const callId = ++fetchRef.current
    setState({ data: null, isLoading: true, error: null })

    getCourseHeader(courseOfferingId)
      .then((data) => {
        if (callId !== fetchRef.current) return
        setState({ data, isLoading: false, error: null })
      })
      .catch(() => {
        if (callId !== fetchRef.current) return
        setState({ data: null, isLoading: false, error: 'Không thể tải thông tin môn học.' })
      })
  }, [courseOfferingId])

  return state
}
