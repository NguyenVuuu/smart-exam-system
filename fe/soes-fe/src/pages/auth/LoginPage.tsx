import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useLogin } from '../../auth/hooks/useLogin'

const loginSchema = z.object({
  identifier: z.string().min(1, 'Identifier is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading } = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 mb-4">
            <LogIn className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Sign in to SOES</h1>
          <p className="text-sm text-gray-500 mt-1">Smart Online Examination System</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(login)} noValidate className="space-y-5">
          {/* Identifier */}
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1.5">
              Student Code / Teacher Code
            </label>
            <input
              {...register('identifier')}
              id="identifier"
              type="text"
              autoComplete="username"
              placeholder="admin@soes.edu.vn / SV000001 / GV000001"
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-colors
                ${errors.identifier
                  ? 'border-red-400 focus:border-red-500 bg-red-50'
                  : 'border-gray-300 focus:border-blue-500 bg-white'
                }`}
            />
            {errors.identifier && (
              <p className="mt-1.5 text-xs text-red-500">{errors.identifier.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                {...register('password')}
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                className={`w-full px-3.5 py-2.5 pr-10 rounded-lg border text-sm outline-none transition-colors
                  ${errors.password
                    ? 'border-red-400 focus:border-red-500 bg-red-50'
                    : 'border-gray-300 focus:border-blue-500 bg-white'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
              text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
