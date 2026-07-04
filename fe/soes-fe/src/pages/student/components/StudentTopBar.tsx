import { ChevronDown, UserCircle } from 'lucide-react'
import { useAuthStore } from '../../../store/authStore'
import { useLogout } from '../../../auth/hooks/useLogout'
import { useState } from 'react'

export default function StudentTopBar() {
  const user = useAuthStore((s) => s.user)
  const { logout } = useLogout()
  const [open, setOpen] = useState(false)

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-end px-6 relative">
      <div className="relative">
        <button
          onClick={() => setOpen((p) => !p)}
          className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
        >
          <UserCircle size={22} className="text-gray-400" />
          <span className="font-medium">{user?.fullName ?? 'Sinh viên'}</span>
          <ChevronDown size={14} className="text-gray-400" />
        </button>

        {open && (
          <div className="absolute right-0 top-9 w-40 bg-white border border-gray-100 rounded-lg shadow-md z-10">
            <button
              onClick={() => { setOpen(false); logout() }}
              className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
