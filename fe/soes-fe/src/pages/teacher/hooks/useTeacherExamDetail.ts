import { useQuery } from '@tanstack/react-query'
import { getTeacherExam } from '../api/teacher-exams.api'
import { toExamDetail } from '../mappers/teacher-exam.mapper'
import { useAuthStore } from '../../../store/authStore'

export function useTeacherExamDetail(id?: string) {
  const ownerId = useAuthStore(state => state.user?.id)
  const query = useQuery({
    queryKey: ['teacher-exam-detail', ownerId, id],
    queryFn: async () => toExamDetail(await getTeacherExam(id!)),
    enabled: Boolean(id), retry: false, gcTime: 0,
    refetchOnWindowFocus: false, refetchOnReconnect: false,
  })
  return {
    exam: query.isError ? null : query.data ?? null,
    loading: query.isFetching,
    error: query.isError ? 'Đề thi không tồn tại hoặc bạn không có quyền truy cập.' : null,
    retry: async () => { if (id) await query.refetch() },
  }
}
