import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../../store/authStore'
import { getReviewGroupAccess } from '../api/teacher-review-groups.api'

export function useReviewGroupAccess() {
  const profileId = useAuthStore((state) => state.user?.profileId)
  return useQuery({
    queryKey: ['teacher', 'review-group', 'access', profileId],
    queryFn: getReviewGroupAccess,
    enabled: Boolean(profileId),
    retry: false,
    refetchOnWindowFocus: true,
  })
}
