import { useEffect, useRef, useState } from 'react'
import { getPostDetail } from '../../api/student-course-detail.api'
import type { PostDetail } from '../../types/course-detail.types'

interface PostDetailState {
  data: PostDetail | null
  isLoading: boolean
  error: string | null
}

export function usePostDetail(courseOfferingId: string, postId: string) {
  const [state, setState] = useState<PostDetailState>({
    data: null,
    isLoading: true,
    error: null,
  })

  const fetchRef = useRef(0)

  function fetch() {
    if (!courseOfferingId || !postId) return

    const callId = ++fetchRef.current
    setState({ data: null, isLoading: true, error: null })

    getPostDetail(courseOfferingId, postId)
      .then((data) => {
        if (callId !== fetchRef.current) return
        setState({ data, isLoading: false, error: null })
      })
      .catch(() => {
        if (callId !== fetchRef.current) return
        setState({ data: null, isLoading: false, error: 'Không thể tải bài đăng.' })
      })
  }

  useEffect(() => {
    fetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseOfferingId, postId])

  return { ...state, refetch: fetch }
}
