import { KeyRound, Mail, Phone, Save, Settings, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '../../store/authStore'
import StudentSidebar from './components/StudentSidebar'
import StudentTopBar from './components/StudentTopBar'
import { changeStudentPassword, updateStudentContact } from './api/student-settings.api'

export default function StudentSettingsPage() {
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const [email, setEmail] = useState(user?.email ?? '')
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingContact, setSavingContact] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    setEmail(user?.email ?? '')
    setPhoneNumber(user?.phoneNumber ?? '')
  }, [user?.email, user?.phoneNumber])

  const saveContact = async () => {
    setSavingContact(true)
    try {
      const updated = await updateStudentContact({
        email: email.trim() || null,
        phoneNumber: phoneNumber.trim() || null,
      })
      setUser(updated)
      toast.success('Đã cập nhật thông tin liên hệ.')
    } catch {
      toast.error('Không thể cập nhật thông tin liên hệ.')
    } finally {
      setSavingContact(false)
    }
  }

  const savePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Xác nhận mật khẩu không khớp.')
      return
    }

    setSavingPassword(true)
    try {
      await changeStudentPassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Đã đổi mật khẩu.')
    } catch {
      toast.error('Không thể đổi mật khẩu. Kiểm tra lại mật khẩu hiện tại.')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">
      <StudentSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <StudentTopBar />
        <main className="min-w-0 flex-1 space-y-5 overflow-y-auto px-6 py-7 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Settings size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-950">Cài đặt</h1>
              <p className="mt-0.5 text-sm text-slate-500">Quản lý thông tin cá nhân và bảo mật tài khoản.</p>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
            <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-4">
                <h2 className="text-sm font-bold text-slate-900">Thông tin cơ bản</h2>
              </div>
              <div className="space-y-5 px-5 py-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <ReadOnlyField icon={<UserRound size={16} />} label="Họ và tên" value={user?.fullName ?? '-'} />
                  <ReadOnlyField icon={<UserRound size={16} />} label="Mã sinh viên" value={user?.studentCode ?? '-'} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Email" icon={<Mail size={16} />}>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="email@example.com"
                      className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </Field>
                  <Field label="Số điện thoại" icon={<Phone size={16} />}>
                    <input
                      value={phoneNumber}
                      onChange={(event) => setPhoneNumber(event.target.value)}
                      placeholder="Nhập số điện thoại"
                      className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </Field>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={saveContact}
                    disabled={savingContact}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save size={16} /> {savingContact ? 'Đang lưu...' : 'Lưu thông tin'}
                  </button>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-4">
                <h2 className="text-sm font-bold text-slate-900">Đổi mật khẩu</h2>
              </div>
              <div className="space-y-4 px-5 py-5">
                <PasswordField label="Mật khẩu hiện tại" value={currentPassword} onChange={setCurrentPassword} />
                <PasswordField label="Mật khẩu mới" value={newPassword} onChange={setNewPassword} />
                <PasswordField label="Xác nhận mật khẩu" value={confirmPassword} onChange={setConfirmPassword} />

                <button
                  type="button"
                  onClick={savePassword}
                  disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <KeyRound size={16} /> {savingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

function ReadOnlyField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
      <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
        {icon}
        {label}
      </div>
      <p className="truncate text-sm font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label className="block rounded-xl border border-gray-200 bg-white px-4 py-3 focus-within:border-blue-400">
      <span className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
        {icon}
        {label}
      </span>
      {children}
    </label>
  )
}

function PasswordField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block rounded-xl border border-gray-200 bg-white px-4 py-3 focus-within:border-blue-400">
      <span className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
        <KeyRound size={16} />
        {label}
      </span>
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none"
      />
    </label>
  )
}
