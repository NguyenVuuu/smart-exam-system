import { KeyRound, UserCog, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import TeacherPageHeader from './components/TeacherPageHeader'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTopBar from './components/TeacherTopBar'
import AccountSecurityTipsCard from './components/account/AccountSecurityTipsCard'
import TeacherAccountSidebarCard from './components/account/TeacherAccountSidebarCard'
import TeacherPasswordForm from './components/account/TeacherPasswordForm'
import TeacherProfileForm from './components/account/TeacherProfileForm'

type AccountTab = 'profile' | 'security'

export default function TeacherAccountPage() {
  const user = useAuthStore((state) => state.user)
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab: AccountTab = searchParams.get('tab') === 'security' ? 'security' : 'profile'

  const selectTab = (tab: AccountTab) => {
    setSearchParams(tab === 'profile' ? {} : { tab }, { replace: true })
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">
      <TeacherSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TeacherTopBar />
        <main className="min-h-0 min-w-0 flex-1 space-y-6 overflow-y-auto px-6 py-7 lg:px-8">
          <TeacherPageHeader
            title="Tài khoản cá nhân"
            description="Quản lý thông tin giảng viên, liên lạc và thiết lập bảo mật mật khẩu"
            icon={<UserCog size={21} />}
          />

          <div className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
            {/* Left Column: Teacher Overview Card */}
            <TeacherAccountSidebarCard user={user} />

            {/* Right Column: Settings & Forms */}
            <div className="space-y-6 min-w-0">
              <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xs">
                {/* Tabs Header */}
                <div className="flex border-b border-gray-100 px-6 gap-2">
                  <AccountTabButton
                    active={activeTab === 'profile'}
                    icon={<UserRound size={16} />}
                    label="Hồ sơ cá nhân"
                    onClick={() => selectTab('profile')}
                  />
                  <AccountTabButton
                    active={activeTab === 'security'}
                    icon={<KeyRound size={16} />}
                    label="Bảo mật & Đổi mật khẩu"
                    onClick={() => selectTab('security')}
                  />
                </div>

                {/* Form Container */}
                <div className="p-6">
                  {activeTab === 'profile' ? <TeacherProfileForm /> : <TeacherPasswordForm />}
                </div>
              </section>

              {/* Security Tips Card */}
              <AccountSecurityTipsCard />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function AccountTabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean
  icon: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex h-13 items-center gap-2 border-b-2 px-3 text-xs font-semibold transition cursor-pointer ${
        active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
