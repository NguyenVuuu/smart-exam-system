import { Navigate } from 'react-router-dom'
import LoadingScreen from '../components/LoadingScreen'
import { useReviewGroupAccess } from '../pages/teacher/hooks/useReviewGroupAccess'

export default function TeacherReviewAccessRoute({ children, permission }: {
  children: React.ReactNode
  permission: 'canViewGroup' | 'canReview'
}) {
  const access = useReviewGroupAccess()

  if (access.isPending) return <LoadingScreen />
  if (access.isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 text-sm text-slate-700">
        <p>Không thể kiểm tra quyền truy cập nhóm duyệt đề.</p>
        <button type="button" onClick={() => void access.refetch()} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white">
          Thử lại
        </button>
      </div>
    )
  }
  if (!access.data[permission]) return <Navigate to="/teacher" replace />
  return <>{children}</>
}
