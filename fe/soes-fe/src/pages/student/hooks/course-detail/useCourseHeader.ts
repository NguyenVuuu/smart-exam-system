import { useAccountQuery } from '../../../../hooks/useAccountQuery'
import { getCourseHeader } from '../../api/student-course-detail.api'

export function useCourseHeader(courseOfferingId: string) {
  const query = useAccountQuery(['course-header', courseOfferingId], () => getCourseHeader(courseOfferingId), Boolean(courseOfferingId))
  return {
    data: query.isError ? null : query.data ?? null,
    isLoading: query.isFetching, error: query.isError ? 'Không thể tải thông tin môn học.' : null,
  }
}
