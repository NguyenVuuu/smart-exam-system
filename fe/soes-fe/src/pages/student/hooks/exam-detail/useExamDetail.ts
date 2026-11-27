import { useAccountQuery } from '../../../../hooks/useAccountQuery'
import { getExamDetail } from '../../api/student-exam-detail.api'

export function useExamDetail(courseOfferingId: string, scheduleId: string) {
  const query = useAccountQuery(['student-exam-detail', courseOfferingId, scheduleId], () => getExamDetail(courseOfferingId, scheduleId), Boolean(courseOfferingId && scheduleId))
  return {
    data: query.isError ? null : query.data ?? null,
    isLoading: query.isFetching, error: query.isError ? 'Không thể tải thông tin bài thi.' : null,
    refetch: query.reload,
  }
}
