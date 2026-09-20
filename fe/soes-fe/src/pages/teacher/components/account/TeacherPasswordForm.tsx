import { Check, Eye, EyeOff, KeyRound, Lock, LockKeyhole, ShieldCheck, X } from 'lucide-react'
import { useState } from 'react'
import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import { toast } from 'sonner'
import { getApiErrorMessage } from '../../../../api/errors'
import { changeTeacherPassword } from '../../api/teacher-account.api'
import AccountFormField from './AccountFormField'

interface PasswordFormValues {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface PasswordInputProps {
  autoComplete: string
  placeholder?: string
  invalid: boolean
  registration: UseFormRegisterReturn
}

function PasswordInput({ autoComplete, placeholder = '••••••••', invalid, registration }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 pr-11 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10"
        aria-invalid={invalid}
        {...registration}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        title={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}

function calculatePasswordStrength(pass: string): { score: number; label: string; color: string } {
  if (!pass) return { score: 0, label: 'Chưa nhập', color: 'bg-gray-200' }
  let score = 0
  if (pass.length >= 6) score += 1
  if (pass.length >= 10) score += 1
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1
  if (/[0-9]/.test(pass)) score += 1
  if (/[^A-Za-z0-9]/.test(pass)) score += 1

  if (score <= 1) return { score: 1, label: 'Yếu', color: 'bg-rose-500' }
  if (score <= 3) return { score: 2, label: 'Trung bình', color: 'bg-amber-500' }
  return { score: 3, label: 'Mạnh', color: 'bg-emerald-500' }
}

export default function TeacherPasswordForm() {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormValues>()

  const newPassword = watch('newPassword', '')
  const confirmPassword = watch('confirmPassword', '')
  const strength = calculatePasswordStrength(newPassword)

  const hasMinLength = newPassword.length >= 6
  const hasLetterAndNumber = /[a-zA-Z]/.test(newPassword) && /[0-9]/.test(newPassword)
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword

  const savePassword = handleSubmit(async ({ currentPassword, newPassword: nextPassword }) => {
    try {
      await changeTeacherPassword({ currentPassword, newPassword: nextPassword })
      reset()
      toast.success('Đã đổi mật khẩu thành công.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể đổi mật khẩu. Vui lòng kiểm tra mật khẩu hiện tại.'))
    }
  })

  return (
    <form onSubmit={savePassword} className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-gray-900">Thiết lập mật khẩu mới</h3>
        <p className="text-xs text-gray-500">
          Mật khẩu mới cần có ít nhất 6 ký tự và khác mật khẩu hiện tại.
        </p>
      </div>

      <div className="space-y-4">
        <AccountFormField
          label="Mật khẩu hiện tại"
          icon={<KeyRound size={15} />}
          error={errors.currentPassword?.message}
          required
        >
          <PasswordInput
            autoComplete="current-password"
            placeholder="Nhập mật khẩu hiện tại của bạn"
            invalid={Boolean(errors.currentPassword)}
            registration={register('currentPassword', { required: 'Vui lòng nhập mật khẩu hiện tại.' })}
          />
        </AccountFormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <AccountFormField
              label="Mật khẩu mới"
              icon={<LockKeyhole size={15} />}
              error={errors.newPassword?.message}
              required
            >
              <PasswordInput
                autoComplete="new-password"
                placeholder="Nhập mật khẩu mới"
                invalid={Boolean(errors.newPassword)}
                registration={register('newPassword', {
                  required: 'Vui lòng nhập mật khẩu mới.',
                  minLength: { value: 6, message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' },
                  maxLength: { value: 100, message: 'Mật khẩu mới không được vượt quá 100 ký tự.' },
                  validate: (value, values) =>
                    value !== values.currentPassword || 'Mật khẩu mới phải khác mật khẩu hiện tại.',
                })}
              />
            </AccountFormField>

            {/* Password strength meter */}
            {newPassword.length > 0 && (
              <div className="space-y-1 pt-1 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-400">Độ mạnh mật khẩu:</span>
                  <span className="font-semibold text-gray-700">{strength.label}</span>
                </div>
                <div className="flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-gray-100">
                  <div className={`h-full flex-1 rounded-full ${strength.score >= 1 ? strength.color : 'bg-transparent'}`} />
                  <div className={`h-full flex-1 rounded-full ${strength.score >= 2 ? strength.color : 'bg-transparent'}`} />
                  <div className={`h-full flex-1 rounded-full ${strength.score >= 3 ? strength.color : 'bg-transparent'}`} />
                </div>
              </div>
            )}
          </div>

          <AccountFormField
            label="Xác nhận mật khẩu mới"
            icon={<Lock size={15} />}
            error={errors.confirmPassword?.message}
            required
          >
            <PasswordInput
              autoComplete="new-password"
              placeholder="Nhập lại mật khẩu mới"
              invalid={Boolean(errors.confirmPassword)}
              registration={register('confirmPassword', {
                required: 'Vui lòng xác nhận mật khẩu mới.',
                validate: (value) => value === newPassword || 'Mật khẩu xác nhận không khớp.',
              })}
            />
          </AccountFormField>
        </div>
      </div>

      {/* Password requirements checklist */}
      <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 space-y-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Tiêu chuẩn mật khẩu an toàn
        </p>
        <div className="grid gap-2.5 sm:grid-cols-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            {hasMinLength ? (
              <Check size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <X size={16} className="text-gray-400 shrink-0" />
            )}
            <span className={hasMinLength ? 'font-medium text-gray-800' : 'text-gray-500'}>
              Tối thiểu 6 ký tự
            </span>
          </div>

          <div className="flex items-center gap-2">
            {hasLetterAndNumber ? (
              <Check size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <X size={16} className="text-gray-400 shrink-0" />
            )}
            <span className={hasLetterAndNumber ? 'font-medium text-gray-800' : 'text-gray-500'}>
              Gồm chữ cái & số
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isMatch ? (
              <Check size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <X size={16} className="text-gray-400 shrink-0" />
            )}
            <span className={isMatch ? 'font-medium text-gray-800' : 'text-gray-500'}>
              Mật khẩu xác nhận khớp
            </span>
          </div>
        </div>
      </div>

      {/* Submit footer */}
      <div className="flex justify-end border-t border-gray-100 pt-5">
        <button
          type="submit"
          disabled={isSubmitting || !hasMinLength || (confirmPassword.length > 0 && !isMatch)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          <ShieldCheck size={16} />
          {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
        </button>
      </div>
    </form>
  )
}
