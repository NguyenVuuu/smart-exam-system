import { useQuery } from '@tanstack/react-query'
import { Navigate, useLocation } from 'react-router-dom'
import { studentFaceApi } from '../pages/student/api/student-face.api'
import { useLogout } from '../auth/hooks/useLogout'

export default function StudentFaceGate({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { logout } = useLogout()
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['student-face-profile'],
    queryFn: () => studentFaceApi.profile(),
    retry: 1,
    staleTime: 30_000,
  })
  if (isPending) return <div className="p-6">Đang kiểm tra tài khoản...</div>
  if (isError) return <div className="p-6">
    Không thể kiểm tra trạng thái xác minh khuôn mặt.
    <button type="button" onClick={() => void refetch()} className="ml-3 text-blue-600">Thử lại</button>
    <button type="button" onClick={() => void logout()} className="ml-3 text-blue-600">Đăng xuất</button>
  </div>
  if (data.enabled && !data.enrolled && location.pathname !== '/student/face-enrollment') {
    return <Navigate to="/student/face-enrollment" replace />
  }
  if (data.enabled && data.enrolled && location.pathname === '/student/face-enrollment') {
    return <Navigate to="/student" replace />
  }
  return <>{children}</>
}
