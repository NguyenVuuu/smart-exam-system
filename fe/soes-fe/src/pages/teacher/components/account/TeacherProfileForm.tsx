import { Info, Mail, Phone, Save, User, UserCheck } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { getApiErrorMessage } from '../../../../api/errors'
import { useAuthStore } from '../../../../store/authStore'
import { updateTeacherProfile } from '../../api/teacher-account.api'
import { getTeacherPositionLabel } from '../../utils/teacher-account.utils'
import AccountFormField from './AccountFormField'

interface ProfileFormValues {
  email: string
  phoneNumber: string
}

const inputClass =
  'h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10'

const readonlyInputClass =
  'h-11 w-full rounded-xl border border-gray-100 bg-gray-50 px-3.5 text-sm font-medium text-gray-700 cursor-not-allowed outline-none select-none'

export default function TeacherProfileForm() {
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProfileFormValues>({
    defaultValues: { email: user?.email ?? '', phoneNumber: user?.phoneNumber ?? '' },
  })

  useEffect(() => {
    reset({ email: user?.email ?? '', phoneNumber: user?.phoneNumber ?? '' })
  }, [reset, user?.email, user?.phoneNumber])

  const saveProfile = handleSubmit(async (values) => {
    try {
      const updatedUser = await updateTeacherProfile({
        email: values.email.trim() || null,
        phoneNumber: values.phoneNumber.trim() || null,
      })
      setUser(updatedUser)
      reset({ email: updatedUser.email ?? '', phoneNumber: updatedUser.phoneNumber ?? '' })
      toast.success('Đã cập nhật thông tin cá nhân thành công.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể cập nhật thông tin cá nhân.'))
    }
  })

  return (
    <form onSubmit={saveProfile} className="space-y-6">
      {/* Section 1: System Identifiers (Readonly) */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Thông tin định danh</h3>
            <p className="text-xs text-gray-500">Thông tin tài khoản được cấp và quản lý bởi Nhà trường</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
            <Info size={12} /> Chỉ xem
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <AccountFormField label="Họ và tên" icon={<User size={15} />}>
            <input
              type="text"
              readOnly
              value={user?.fullName ?? ''}
              className={readonlyInputClass}
              title="Họ và tên giảng viên do hệ thống quản lý"
            />
          </AccountFormField>

          <AccountFormField label="Mã giảng viên" icon={<UserCheck size={15} />}>
            <input
              type="text"
              readOnly
              value={user?.teacherCode ?? '-'}
              className={readonlyInputClass}
              title="Mã giảng viên chính thức"
            />
          </AccountFormField>

          <AccountFormField label="Chức vụ chuyên môn">
            <input
              type="text"
              readOnly
              value={getTeacherPositionLabel(user?.position)}
              className={readonlyInputClass}
            />
          </AccountFormField>

          <AccountFormField label="Vai trò hệ thống">
            <input
              type="text"
              readOnly
              value={user?.role === 'TEACHER' ? 'Giảng viên' : user?.role ?? '-'}
              className={readonlyInputClass}
            />
          </AccountFormField>
        </div>
      </div>

      {/* Section 2: Contact Information (Editable) */}
      <div className="space-y-3.5 border-t border-gray-100 pt-5">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Thông tin liên lạc</h3>
          <p className="text-xs text-gray-500">
            Email và số điện thoại dùng để nhận thông báo ca thi, duyệt đề và liên lạc khẩn cấp
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <AccountFormField
            label="Email liên lạc"
            icon={<Mail size={15} />}
            error={errors.email?.message}
            hint="Email nhận thông báo kết quả và lịch coi thi"
          >
            <input
              type="email"
              autoComplete="email"
              placeholder="giangvien@soes.edu.vn"
              className={inputClass}
              aria-invalid={Boolean(errors.email)}
              {...register('email', {
                validate: (value) =>
                  !value.trim() || /^S+@S+.S+$/.test(value.trim()) || 'Email không đúng định dạng.',
              })}
            />
          </AccountFormField>

          <AccountFormField
            label="Số điện thoại"
            icon={<Phone size={15} />}
            error={errors.phoneNumber?.message}
            hint="Dùng để liên hệ nhanh khi giám sát thi"
          >
            <input
              type="tel"
              autoComplete="tel"
              placeholder="Nhập số điện thoại (ví dụ: 0912345678)"
              className={inputClass}
              aria-invalid={Boolean(errors.phoneNumber)}
              {...register('phoneNumber', {
                maxLength: { value: 20, message: 'Số điện thoại không được vượt quá 20 ký tự.' },
                validate: (value) =>
                  !value.trim() || /^[0-9+().s-]+$/.test(value.trim()) || 'Số điện thoại chứa ký tự không hợp lệ.',
              })}
            />
          </AccountFormField>
        </div>
      </div>

      {/* Actions footer */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-5">
        <span className="text-xs text-gray-500">
          {isDirty ? 'Có thay đổi chưa được lưu.' : 'Thông tin đang đồng bộ.'}
        </span>
        <button
          type="submit"
          disabled={!isDirty || isSubmitting}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          <Save size={16} />
          {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>
    </form>
  )
}
