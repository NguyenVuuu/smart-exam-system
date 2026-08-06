import { useEffect, useRef, useState } from 'react'
import { getScores } from '../../api/student-course-detail.api'
import type { ScoreItem } from '../../types/course-detail.types'

interface ScoresState {
  items: ScoreItem[]
  isLoading: boolean
  error: string | null
}

export function useScores(courseOfferingId: string) {
  const [state, setState] = useState<ScoresState>({
    items: [],
    isLoading: true,
    error: null,
  })

  const fetchRef = useRef(0)

  useEffect(() => {
    if (!courseOfferingId) return

    const callId = ++fetchRef.current
    setState({ items: [], isLoading: true, error: null })

    getScores(courseOfferingId)
      .then((data) => {
        if (callId !== fetchRef.current) return
        setState({ items: data.items, isLoading: false, error: null })
      })
      .catch(() => {
        if (callId !== fetchRef.current) return
        setState({ items: [], isLoading: false, error: 'Không thể tải điểm số.' })
      })
  }, [courseOfferingId])

  return state
}
