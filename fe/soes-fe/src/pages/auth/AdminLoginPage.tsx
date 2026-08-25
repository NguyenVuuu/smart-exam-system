import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, ShieldCheck, UserCheck, Lock } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useLogin } from '../../auth/hooks/useLogin'
import { useAuthStore } from '../../store/authStore'

const adminLoginSchema = z.object({
  identifier: z.string().min(1, 'Vui lòng nhập Email hoặc Mã Quản trị viên'),
  password: z.string().min(1, 'Vui lòng nhập Mật khẩu'),
})

type AdminLoginFormValues = z.infer<typeof adminLoginSchema>

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading } = useLogin()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      identifier: 'admin@soes.edu.vn',
      password: 'admin',
    },
  })

  const onSubmit = (data: AdminLoginFormValues) => {
    login(data)
  }

  const handleQuickDemoAdmin = () => {
    // Set admin user directly into Zustand store for seamless demo
    useAuthStore.getState().setUser({
      id: 'usr-admin-01',
      profileId: 'prof-admin-01',
      email: 'admin@soes.edu.vn',
      fullName: 'Trần Quang Huy',
      avatarUrl: null,
      role: 'ADMIN',
      studentCode: null,
      teacherCode: null,
      adminCode: 'ADM001',
    })
    navigate('/admin')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070c16] relative overflow-hidden font-sans p-4 select-none">
      {/* Background ambient lighting effects matching Admin Dark theme */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#10b981]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#059669]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#10b981]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphic Dark Card Container */}
      <div className="w-full max-w-md bg-[#0e1726]/90 backdrop-blur-2xl rounded-3xl border border-slate-800 shadow-2xl shadow-black/80 p-8 sm:p-10 space-y-6 relative z-10">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#10b981] text-white font-bold text-xl flex items-center justify-center shadow-lg shadow-[#10b981]/30 shrink-0">
              S
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-white tracking-tight">SOES</span>
                <span className="text-[10px] font-bold text-[#10b981] bg-[#10b981]/15 border border-[#10b981]/30 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Quản trị viên
                </span>
              </div>
              <span className="text-xs text-slate-400 font-normal block leading-tight mt-0.5">
                Thi trực tuyến thông minh
              </span>
            </div>
          </div>

          <div className="pt-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Cổng Đăng Nhập Quản Trị</h1>
            <p className="text-xs text-slate-400 font-normal mt-1">
              Hệ thống Quản lý Học vụ & Thẩm định Khảo thí
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Email / Admin Code Input */}
          <div className="space-y-1.5">
            <label htmlFor="identifier" className="block text-xs font-semibold text-slate-300">
              Tài khoản Quản trị / Email
            </label>
            <div className="relative">
              <input
                {...register('identifier')}
                id="identifier"
                type="text"
                autoComplete="username"
                placeholder="admin@soes.edu.vn"
                className={`w-full px-4 py-3 rounded-xl border text-xs text-white placeholder-slate-500 outline-none transition-all bg-[#080d19] ${
                  errors.identifier
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                    : 'border-slate-800 focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20'
                }`}
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                <ShieldCheck size={16} />
              </div>
            </div>
            {errors.identifier && (
              <p className="text-[11px] text-rose-400 font-medium">{errors.identifier.message}</p>
            )}
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-xs font-semibold text-slate-300">
                Mật khẩu
              </label>
              <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Vui lòng liên hệ Trưởng ban CNTT để cấp lại mật khẩu Quản trị.') }} className="text-[11px] text-[#10b981] hover:underline font-medium">
                Quên mật khẩu?
              </a>
            </div>
            <div className="relative">
              <input
                {...register('password')}
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className={`w-full px-4 py-3 pr-10 rounded-xl border text-xs text-white placeholder-slate-500 outline-none transition-all bg-[#080d19] ${
                  errors.password
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                    : 'border-slate-800 focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-[11px] text-rose-400 font-medium">{errors.password.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-[#10b981] hover:bg-[#059669] active:bg-[#047857] disabled:bg-[#10b981]/50 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-[#10b981]/25 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <Lock size={15} />
            <span>{isLoading ? 'Đang truy cập...' : 'Đăng nhập Quản trị viên'}</span>
          </button>
        </form>

        {/* Demo Fast Login Accent Box */}
        <div className="pt-2">
          <div className="p-3 bg-[#080d19] border border-slate-800/80 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#e11d48] text-white font-bold text-xs flex items-center justify-center shrink-0">
                TQ
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-white">Trần Quang Huy</p>
                <p className="text-[11px] text-slate-400">Tài khoản Quản trị mẫu</p>
              </div>
            </div>
            <button
              onClick={handleQuickDemoAdmin}
              className="px-3 py-1.5 bg-[#10b981]/15 hover:bg-[#10b981]/25 text-[#10b981] border border-[#10b981]/30 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <UserCheck size={13} />
              <span>Vào nhanh</span>
            </button>
          </div>
        </div>

        {/* Switch to Teacher / Student Portal Link */}
        <div className="text-center pt-2 border-t border-slate-800/80">
          <Link
            to="/login"
            className="text-xs font-medium text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1.5"
          >
            <span>Chuyển sang Cổng Giảng viên & Sinh viên</span>
            <span className="text-[#10b981]">→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
