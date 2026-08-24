import { Bell, ChevronDown, HelpCircle, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLogout } from '../../../auth/hooks/useLogout'
import { useAuthStore } from '../../../store/authStore'
import { persistentTeacherIsCollapsed } from './TeacherSidebar'

export default function TeacherTopBar() {
  const user = useAuthStore((s) => s.user)
  const { logout } = useLogout()
  const [openUserMenu, setOpenUserMenu] = useState(false)
  const [openNotifications, setOpenNotifications] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => persistentTeacherIsCollapsed)

  useEffect(() => {
    const handleToggle = () => {
      setIsSidebarCollapsed((prev) => !prev)
    }
    window.addEventListener('toggle-sidebar', handleToggle)
    return () => window.removeEventListener('toggle-sidebar', handleToggle)
  }, [])

  const notifications = [
    { id: '1', title: 'Sinh viên nộp bài', desc: 'Nguyễn Văn A đã nộp bài thi Giữa Kỳ Java', time: '5 phút trước', unread: true },
    { id: '2', title: 'Cảnh báo vi phạm thi', desc: 'Phát hiện không thấy mặt tại Kỳ thi C++ 01', time: '12 phút trước', unread: true },
  ]

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 relative shrink-0">
      {/* Left side: Sidebar Toggle button */}
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

      <div className="flex items-center gap-4">
        {/* Help Circle */}
        <button
          className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-colors flex items-center justify-center text-sm font-semibold"
          title="Trợ giúp & Hướng dẫn"
        >
          <HelpCircle size={18} />
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setOpenNotifications((p) => !p)}
            className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full relative transition-colors"
            title="Thông báo"
          >
            <Bell size={19} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
          </button>

          {openNotifications && (
            <div className="absolute right-0 top-11 w-72 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 py-2">
              <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900">Thông báo giảng dạy</span>
                <span className="text-xs text-blue-600 font-medium cursor-pointer">Đã đọc</span>
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-gray-50">
                {notifications.map((item) => (
                  <div key={item.id} className="p-3 text-xs hover:bg-gray-50 cursor-pointer">
                    <div className="flex justify-between items-start mb-0.5">
                      <span className="font-semibold text-gray-900">{item.title}</span>
                      <span className="text-xs text-gray-400">{item.time}</span>
                    </div>
                    <p className="text-gray-500 text-xs">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Account */}
        <div className="relative">
          <button
            onClick={() => setOpenUserMenu((p) => !p)}
            className="flex items-center gap-2.5 p-1 pr-2.5 rounded-full hover:bg-gray-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              NV
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-gray-900 leading-tight">
                {user?.fullName ?? 'Nguyễn Văn An'}
              </p>
              <p className="text-[11px] text-gray-400 font-medium leading-none mt-0.5">
                Giảng viên
              </p>
            </div>
            <ChevronDown size={14} className="text-gray-400 ml-1" />
          </button>

          {openUserMenu && (
            <div className="absolute right-0 top-12 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 py-2 font-sans">
              <div className="px-4 py-2 text-xs border-b border-gray-100">
                <p className="font-bold text-gray-900">{user?.fullName ?? 'Nguyễn Văn An'}</p>
                <p className="text-xs text-gray-400">Tài khoản Giảng viên</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setOpenUserMenu(false)
                    logout()
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
