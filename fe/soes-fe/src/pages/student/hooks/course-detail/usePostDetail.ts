import { useAccountQuery } from '../../../../hooks/useAccountQuery'
import { getPostDetail } from '../../api/student-course-detail.api'

export function usePostDetail(courseOfferingId: string, postId: string) {
  const query = useAccountQuery(['course-post', courseOfferingId, postId], () => getPostDetail(courseOfferingId, postId), Boolean(courseOfferingId && postId))
  return {
    data: query.isError ? null : query.data ?? null,
    isLoading: query.isFetching, error: query.isError ? 'Không thể tải bài đăng.' : null,
    refetch: query.reload,
  }
}
