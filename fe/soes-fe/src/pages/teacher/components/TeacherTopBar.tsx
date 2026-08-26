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
    <header className="relative flex h-16 shrink-0 items-center justify-between border-b border-gray-100 bg-white px-6 font-sans text-slate-800">
      {/* Left side: Sidebar Toggle button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
          className="flex items-center justify-center rounded-xl p-2 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
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
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-slate-500 transition-colors hover:bg-gray-200 hover:text-slate-800"
          title="Trợ giúp & Hướng dẫn"
        >
          <HelpCircle size={18} />
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setOpenNotifications((p) => !p)}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-gray-100 hover:text-slate-800"
            title="Thông báo"
          >
            <Bell size={19} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
          </button>

          {openNotifications && (
            <div className="absolute right-0 top-11 z-20 w-72 rounded-2xl border border-gray-100 bg-white py-2 shadow-xl">
              <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-950">Thông báo giảng dạy</span>
                <span className="text-xs text-blue-600 font-medium cursor-pointer">Đã đọc</span>
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-gray-50">
                {notifications.map((item) => (
                  <div key={item.id} className="p-3 text-xs hover:bg-gray-50 cursor-pointer">
                    <div className="flex justify-between items-start mb-0.5">
                      <span className="font-semibold text-slate-900">{item.title}</span>
                      <span className="text-xs text-gray-400">{item.time}</span>
                    </div>
                    <p className="text-xs text-slate-500">{item.desc}</p>
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
            className="flex items-center gap-2.5 rounded-full p-1 pr-2.5 transition-colors hover:bg-gray-50"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-xs">
              NV
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold leading-tight text-slate-950">
                {user?.fullName ?? 'Nguyễn Văn An'}
              </p>
              <p className="mt-0.5 text-[11px] font-normal leading-none text-slate-500">
                Giảng viên
              </p>
            </div>
            <ChevronDown size={14} className="text-gray-400 ml-1" />
          </button>

          {openUserMenu && (
            <div className="absolute right-0 top-12 z-20 w-56 rounded-2xl border border-gray-100 bg-white py-2 font-sans shadow-xl">
              <div className="px-4 py-2 text-xs border-b border-gray-100">
                <p className="font-semibold text-slate-950">{user?.fullName ?? 'Nguyễn Văn An'}</p>
                <p className="text-xs text-slate-500">Tài khoản Giảng viên</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setOpenUserMenu(false)
                    logout()
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50"
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
