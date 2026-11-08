import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import FaceVerification from './components/face/FaceVerification'

export default function StudentFaceEnrollmentPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return (
    <main className="mx-auto max-w-2xl space-y-5 p-5">
      <h1 className="text-xl font-bold text-slate-900">Xác minh danh tính sinh viên</h1>
      <p className="text-sm text-slate-600">Đăng ký khuôn mặt một lần để xác minh trước khi tham gia các ca thi.</p>
      <FaceVerification purpose="ENROLLMENT" onPassed={() => {
        void queryClient.invalidateQueries({ queryKey: ['student-face-profile'] })
        navigate('/student', { replace: true })
      }} />
    </main>
  )
}
