import { IdCard, KeyRound, ShieldCheck, UserCog, UserRound } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import AccountPasswordForm from '../account/components/AccountPasswordForm'
import AccountSecurityTipsCard from '../account/components/AccountSecurityTipsCard'
import AdminLayout from './components/AdminLayout'
import AdminPageHeader from './components/AdminPageHeader'
import AdminProfileForm from './components/account/AdminProfileForm'

export default function AdminAccountPage() {
  const user = useAuthStore((state) => state.user)
  const [searchParams, setSearchParams] = useSearchParams()
  const securityTab = searchParams.get('tab') === 'security'
  const roleLabel = user?.role === 'EDUCATION_OFFICER' ? 'Giáo vụ' : 'Quản trị viên'
  const initials = user?.fullName?.trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase() || 'TK'

  return (
    <AdminLayout>
      <AdminPageHeader icon={<UserCog size={21} />} title="Tài khoản cá nhân"
        description="Quản lý thông tin liên lạc và bảo mật tài khoản." />

      <div className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-2xs">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-emerald-600 text-2xl font-bold text-white">
              {user?.avatarUrl ? <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" /> : initials}
            </div>
            <h2 className="mt-3 text-base font-bold text-gray-900">{user?.fullName ?? 'Tài khoản'}</h2>
            <span className="mt-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              {roleLabel}
            </span>
          </div>
          <div className="space-y-3 border-t border-gray-100 pt-5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-gray-500"><IdCard size={14} /> Mã người dùng</span>
              <span className="font-mono font-semibold text-gray-800">{user?.adminCode ?? '-'}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-gray-500"><ShieldCheck size={14} /> Vai trò</span>
              <span className="font-semibold text-gray-800">{roleLabel}</span>
            </div>
          </div>
        </aside>

        <div className="min-w-0 space-y-6">
          <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xs">
            <div role="tablist" aria-label="Tài khoản cá nhân" className="flex gap-2 border-b border-gray-100 px-4 sm:px-6">
              <button type="button" role="tab" aria-selected={!securityTab} onClick={() => setSearchParams({}, { replace: true })}
                className={`inline-flex min-h-13 items-center gap-2 border-b-2 px-3 text-xs font-semibold transition ${
                  !securityTab ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}>
                <UserRound size={16} /> Hồ sơ cá nhân
              </button>
              <button type="button" role="tab" aria-selected={securityTab} onClick={() => setSearchParams({ tab: 'security' }, { replace: true })}
                className={`inline-flex min-h-13 items-center gap-2 border-b-2 px-3 text-xs font-semibold transition ${
                  securityTab ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}>
                <KeyRound size={16} /> Bảo mật & Đổi mật khẩu
              </button>
            </div>
            <div className="p-6">{securityTab ? <AccountPasswordForm /> : <AdminProfileForm />}</div>
          </section>
          <AccountSecurityTipsCard audience={roleLabel} />
        </div>
      </div>
    </AdminLayout>
  )
}
