import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, LogOut, ShieldCheck, SunMedium } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLogout } from '../../auth/hooks/useLogout'
import FaceVerification from './components/face/FaceVerification'

export default function StudentFaceEnrollmentPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { logout } = useLogout()
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <nav aria-label="Điều hướng đăng ký khuôn mặt" className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => void logout()} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600">
          <ArrowLeft size={18} aria-hidden="true" /> Quay lại đăng nhập
        </button>
        <button type="button" onClick={() => void logout()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600">
          <LogOut size={18} aria-hidden="true" /> Đăng xuất
        </button>
      </nav>
      <header className="mb-8 max-w-3xl">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">
          <ShieldCheck size={16} aria-hidden="true" /> Xác minh sinh viên
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Đăng ký khuôn mặt</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Hoàn thành một lần để bảo vệ tài khoản và xác minh danh tính trước khi vào bài thi trên web.
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <FaceVerification purpose="ENROLLMENT" onPassed={() => {
          void queryClient.invalidateQueries({ queryKey: ['student-face-profile'] })
          navigate('/student', { replace: true })
        }} />

        <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-label="Hướng dẫn quét khuôn mặt">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <SunMedium size={23} aria-hidden="true" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Để quét dễ thành công</h2>
          <ol className="mt-4 space-y-4 text-sm leading-6 text-slate-600">
            <li><strong className="text-slate-800">1. Ánh sáng đều.</strong> Tránh ngồi ngược sáng hoặc để đèn chiếu thẳng vào mặt.</li>
            <li><strong className="text-slate-800">2. Mặt không bị che.</strong> Bỏ khẩu trang, kính râm và giữ camera ngang tầm mắt.</li>
            <li><strong className="text-slate-800">3. Theo khung bầu dục.</strong> Di chuyển gần hoặc xa đến khi mặt nằm vừa khung, rồi giữ yên.</li>
          </ol>
        </aside>
      </div>
    </main>
  )
}
