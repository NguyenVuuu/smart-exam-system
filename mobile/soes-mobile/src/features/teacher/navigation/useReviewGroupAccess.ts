import { useEffect, useState } from 'react'
import { apiClient } from '../../../api/client'
import type { ApiResponse } from '../../../types/auth.types'

export interface ReviewGroupAccess { canViewGroup: boolean; canReview: boolean }

export function useReviewGroupAccess(enabled: boolean) {
  const [access, setAccess] = useState<ReviewGroupAccess | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!enabled) return
    let active = true
    apiClient.get<ApiResponse<ReviewGroupAccess>>('/teacher/review-group/access')
      .then(({ data }) => { if (active) setAccess(data.data) })
      .catch(() => { if (active) setAccess({ canViewGroup: false, canReview: false }) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [enabled])

  return { access, loading }
}
