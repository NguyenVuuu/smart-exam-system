import { Bell, ChevronDown, PanelLeftClose, PanelLeftOpen, UserCircle } from 'lucide-react'
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

      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setOpenNotifications((p) => !p)}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg relative transition-colors"
          >
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
          </button>

          {openNotifications && (
            <div className="absolute right-0 top-9 w-72 bg-white border border-gray-100 rounded-lg shadow-md z-20 py-2">
              <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900">Thông báo giảng dạy</span>
                <span className="text-[10px] text-blue-600 font-medium cursor-pointer">Đã đọc</span>
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-gray-50">
                {notifications.map((item) => (
                  <div key={item.id} className="p-3 text-xs hover:bg-gray-50 cursor-pointer">
                    <div className="flex justify-between items-start mb-0.5">
                      <span className="font-semibold text-gray-900">{item.title}</span>
                      <span className="text-[10px] text-gray-400">{item.time}</span>
                    </div>
                    <p className="text-gray-500 text-[11px]">{item.desc}</p>
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
            className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
          >
            <UserCircle size={22} className="text-gray-400" />
            <span className="font-medium">{user?.fullName ?? 'Giảng viên'}</span>
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          {openUserMenu && (
            <div className="absolute right-0 top-9 w-52 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1.5 divide-y divide-gray-100 font-sans">
              <div className="px-4 py-2 text-xs">
                <p className="font-bold text-gray-900">{user?.fullName ?? 'Giảng viên'}</p>
                <p className="text-[10px] text-gray-400">Tài khoản: Giảng viên</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setOpenUserMenu(false)
                    useAuthStore.getState().setUser({
                      id: 'usr-admin-01',
                      profileId: 'prof-admin-01',
                      email: 'admin@soes.edu.vn',
                      fullName: 'TS. Trần Khảo Thí (Admin)',
                      avatarUrl: null,
                      role: 'ADMIN',
                      studentCode: null,
                      teacherCode: null,
                      adminCode: 'AD000001',
                    })
                    window.location.href = '/admin'
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors flex items-center gap-2"
                >
                  <span>Chuyển sang Ban Khảo Thí</span>
                </button>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setOpenUserMenu(false)
                    logout()
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
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
