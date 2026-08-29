import { ChevronDown, PanelLeftClose, PanelLeftOpen, UserCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLogout } from '../../../auth/hooks/useLogout'
import { useAuthStore } from '../../../store/authStore'
import { persistentStudentIsCollapsed } from './StudentSidebar'

export default function StudentTopBar() {
  const user = useAuthStore((s) => s.user)
  const { logout } = useLogout()
  const [open, setOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(
    () => persistentStudentIsCollapsed || window.matchMedia('(max-width: 767px)').matches,
  )

  useEffect(() => {
    const handleToggle = () => {
      setIsSidebarCollapsed((prev) => !prev)
    }
    window.addEventListener('toggle-sidebar', handleToggle)
    return () => window.removeEventListener('toggle-sidebar', handleToggle)
  }, [])

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 relative shrink-0">
      {/* Left side: Pure Icon-Only Sidebar Toggle button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors flex items-center justify-center"
          title={isSidebarCollapsed ? 'Mở rộng menu thanh bên' : 'Thu gọn menu thanh bên'}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen size={20} className="text-blue-600" />
          ) : (
            <PanelLeftClose size={20} />
          )}
        </button>
      </div>
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
