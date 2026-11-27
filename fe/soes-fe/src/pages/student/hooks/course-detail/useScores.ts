import { useAccountQuery } from '../../../../hooks/useAccountQuery'
import { getScores } from '../../api/student-course-detail.api'

export function useScores(courseOfferingId: string) {
  const query = useAccountQuery(['course-scores', courseOfferingId], () => getScores(courseOfferingId), Boolean(courseOfferingId))
  return {
    items: query.isError ? [] : query.data?.items ?? [],
    isLoading: query.isFetching, error: query.isError ? 'Không thể tải điểm số.' : null,
  }
}
