import { Info, Mail, Phone, Save, User, UserCheck } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { getApiErrorMessage } from '../../../../api/errors'
import { useAuthStore } from '../../../../store/authStore'
import { updateAccountProfile } from '../../../account/api/account.api'
import AccountFormField from '../../../account/components/AccountFormField'

interface ProfileValues {
  email: string
  phoneNumber: string
}

const inputClass = 'h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10'
const readonlyClass = 'h-11 w-full rounded-xl border border-gray-100 bg-gray-50 px-3.5 text-sm font-medium text-gray-700 outline-none'

export default function AdminProfileForm() {
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const { register, handleSubmit, reset, formState: { errors, isDirty, isSubmitting } } = useForm<ProfileValues>({
    defaultValues: { email: user?.email ?? '', phoneNumber: user?.phoneNumber ?? '' },
  })

  useEffect(() => {
    reset({ email: user?.email ?? '', phoneNumber: user?.phoneNumber ?? '' })
  }, [reset, user?.email, user?.phoneNumber])

  const save = handleSubmit(async (values) => {
    try {
      const updated = await updateAccountProfile({
        email: values.email.trim() || null,
        phoneNumber: values.phoneNumber.trim() || null,
      })
      setUser(updated)
      reset({ email: updated.email ?? '', phoneNumber: updated.phoneNumber ?? '' })
      toast.success('Đã cập nhật thông tin cá nhân.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể cập nhật thông tin cá nhân.'))
    }
  })

  return (
    <form onSubmit={save} className="space-y-6">
      <section className="space-y-3.5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Thông tin định danh</h2>
            <p className="text-xs text-gray-500">Thông tin tài khoản do nhà trường quản lý.</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
            <Info size={12} /> Chỉ xem
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <AccountFormField label="Họ và tên" icon={<User size={15} />}>
            <input readOnly value={user?.fullName ?? ''} className={readonlyClass} />
          </AccountFormField>
          <AccountFormField label="Mã người dùng" icon={<UserCheck size={15} />}>
            <input readOnly value={user?.adminCode ?? '-'} className={readonlyClass} />
          </AccountFormField>
          <AccountFormField label="Vai trò hệ thống">
            <input readOnly value={user?.role === 'EDUCATION_OFFICER' ? 'Giáo vụ' : 'Quản trị viên'} className={readonlyClass} />
          </AccountFormField>
        </div>
      </section>

      <section className="space-y-3.5 border-t border-gray-100 pt-5">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Thông tin liên lạc</h2>
          <p className="text-xs text-gray-500">Email và số điện thoại dùng để liên hệ và nhận thông báo.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <AccountFormField label="Email liên lạc" icon={<Mail size={15} />} error={errors.email?.message}>
            <input type="email" autoComplete="email" placeholder="ten@soes.edu.vn" className={inputClass}
              aria-invalid={Boolean(errors.email)} {...register('email', {
                validate: (value) => !value.trim() || /^\S+@\S+\.\S+$/.test(value.trim()) || 'Email không đúng định dạng.',
              })} />
          </AccountFormField>
          <AccountFormField label="Số điện thoại" icon={<Phone size={15} />} error={errors.phoneNumber?.message}>
            <input type="tel" autoComplete="tel" placeholder="Nhập số điện thoại" className={inputClass}
              aria-invalid={Boolean(errors.phoneNumber)} {...register('phoneNumber', {
                maxLength: { value: 20, message: 'Số điện thoại không được vượt quá 20 ký tự.' },
                validate: (value) => !value.trim() || /^[0-9+().\s-]+$/.test(value.trim()) || 'Số điện thoại chứa ký tự không hợp lệ.',
              })} />
          </AccountFormField>
        </div>
      </section>

      <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-5">
        <span className="text-xs text-gray-500">{isDirty ? 'Có thay đổi chưa được lưu.' : 'Thông tin đang đồng bộ.'}</span>
        <button type="submit" disabled={!isDirty || isSubmitting}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
          <Save size={16} /> {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>
    </form>
  )
}
