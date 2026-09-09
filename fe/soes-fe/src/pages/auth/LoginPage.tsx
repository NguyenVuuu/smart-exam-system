import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useLogin } from '../../auth/hooks/useLogin'
import { useSystemSettingsStore } from '../../store/systemSettingsStore'

const loginSchema = z.object({
  identifier: z.string().min(1, 'Identifier is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading } = useLogin()
  const systemSettings = useSystemSettingsStore((state) => state.settings)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          {systemSettings.logoUrl ? (
            <div className="inline-flex items-center justify-center w-16 h-16 mb-2">
              <img src={systemSettings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-1 text-white shadow-md">
              <LogIn className="w-6 h-6" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {systemSettings.organizationName || 'Cổng Khảo Thí Trực Tuyến'}
          </h1>
          <p className="text-xs text-gray-500">{systemSettings.slogan || 'Smart Online Examination System'}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(login)} noValidate className="space-y-4">
          {/* Identifier */}
          <div className="space-y-1">
            <label htmlFor="identifier" className="block text-xs font-bold text-gray-700">
              Student Code / Teacher Code / Email
            </label>
            <input
              {...register('identifier')}
              id="identifier"
              type="text"
              autoComplete="username"
              placeholder="admin@soes.edu.vn / SV000001 / GV000001"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none transition-colors ${
                errors.identifier
                  ? 'border-red-400 focus:border-red-500 bg-red-50'
                  : 'border-gray-200 focus:border-blue-500 bg-gray-50/50'
              }`}
            />
            {errors.identifier && (
              <p className="text-[11px] text-red-500">{errors.identifier.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label htmlFor="password" className="block text-xs font-bold text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                {...register('password')}
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password..."
                className={`w-full px-3.5 py-2.5 pr-10 rounded-xl border text-xs outline-none transition-colors ${
                  errors.password
                    ? 'border-red-400 focus:border-red-500 bg-red-50'
                    : 'border-gray-200 focus:border-blue-500 bg-gray-50/50'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-[11px] text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>

      {/* Footer */}
      <footer className="mt-6 text-center text-xs text-gray-400">
        <p>{systemSettings.copyright || '© 2026 SOES - Smart Online Exam System'}</p>
        <p className="mt-1 text-[11px] text-gray-400">
          Hotline: <span className="font-semibold text-gray-600">{systemSettings.supportHotline || '1900 6868'}</span>
          {' · '}
          Email: <span className="font-semibold text-gray-600">{systemSettings.supportEmail || 'hotro.khaothi@soes.edu.vn'}</span>
        </p>
      </footer>
    </div>
  )
}
