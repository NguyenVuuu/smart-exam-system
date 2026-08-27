import { Bell, ChevronDown, HelpCircle, PanelLeftClose, PanelLeftOpen, UserCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLogout } from '../../../auth/hooks/useLogout'
import { useAuthStore } from '../../../store/authStore'
import { persistentAdminIsCollapsed } from './AdminSidebar'

export default function AdminTopBar() {
  const user = useAuthStore((s) => s.user)
  const { logout } = useLogout()
  const [openUserMenu, setOpenUserMenu] = useState(false)
  const [openNotifications, setOpenNotifications] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => persistentAdminIsCollapsed)

  useEffect(() => {
    const handleToggle = () => {
      setIsSidebarCollapsed((prev) => !prev)
    }
    window.addEventListener('toggle-sidebar', handleToggle)
    return () => window.removeEventListener('toggle-sidebar', handleToggle)
  }, [])

  const notifications = [
    { id: '1', title: 'Đề cuối kỳ chờ chuyên môn', desc: 'GV Nguyễn Văn Giảng đã gửi đề thi Cuối kỳ Java cho Trưởng bộ môn', time: '10 phút trước' },
    { id: '2', title: 'Câu hỏi chờ chuyên môn', desc: 'Có 3 câu hỏi mới gửi vào ngân hàng chung của bộ môn', time: '25 phút trước' },
  ]

  return (
    <header
      style={{ backgroundColor: 'rgb(30, 41, 59)' }}
      className="h-16 border-b border-slate-700/60 px-6 flex items-center justify-between shrink-0 font-sans text-white z-10 select-none"
    >
      {/* Left side: Sidebar Toggle button & label */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
          className="p-2 text-slate-300 hover:text-[#10b981] hover:bg-slate-700/60 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
          title={isSidebarCollapsed ? 'Mở rộng menu thanh bên' : 'Thu gọn menu thanh bên'}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen size={20} className="text-[#10b981]" />
          ) : (
            <PanelLeftClose size={20} />
          )}
        </button>
        <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
          Cổng Quản Trị & Khảo Thí Hệ Thống (Admin Portal)
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Help Circle */}
        <button
          className="w-8 h-8 rounded-full border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center justify-center"
          title="Trợ giúp Quản trị"
        >
          <HelpCircle size={17} />
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setOpenNotifications((p) => !p)}
            className="w-8 h-8 rounded-full border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center justify-center relative"
            title="Thông báo Quản trị"
          >
            <Bell size={17} />
            <span className="w-2 h-2 rounded-full bg-[#10b981] absolute top-1.5 right-1.5 ring-2 ring-[#0b1322]" />
          </button>

          {openNotifications && (
            <div className="absolute right-0 top-10 w-72 bg-[#0e1726] border border-slate-800 rounded-2xl shadow-2xl z-30 py-2">
              <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-white">Thông báo Quản trị</span>
                <span className="text-[11px] text-[#10b981] font-medium cursor-pointer">Đã đọc</span>
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.map((item) => (
                  <div key={item.id} className="p-3 text-xs hover:bg-slate-800/40 cursor-pointer">
                    <div className="flex justify-between items-start mb-0.5">
                      <span className="font-semibold text-slate-200">{item.title}</span>
                      <span className="text-[10px] text-slate-400">{item.time}</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setOpenUserMenu((p) => !p)}
            className="flex items-center gap-2.5 p-1 pr-2 rounded-full hover:bg-slate-800/60 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#e11d48] text-white font-bold text-xs flex items-center justify-center shrink-0">
              TQ
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-white leading-tight">
                {user?.fullName ?? 'Trần Quang Huy'}
              </p>
              <p className="text-[11px] text-slate-400 font-normal leading-none mt-0.5">
                Quản trị viên
              </p>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {openUserMenu && (
            <div className="absolute right-0 top-11 w-56 bg-[#0e1726] border border-slate-800 rounded-2xl shadow-2xl z-30 py-2 font-sans">
              <div className="px-4 py-2 border-b border-slate-800">
                <p className="text-xs font-bold text-white">{user?.fullName ?? 'Trần Quang Huy'}</p>
                <p className="text-[11px] text-[#10b981] font-semibold">Tài khoản Quản trị viên</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setOpenUserMenu(false)
                    useAuthStore.getState().setUser({
                      id: 'usr-teacher-01',
                      profileId: 'prof-teacher-01',
                      email: 'teacher@soes.edu.vn',
                      fullName: 'TS. Nguyễn Văn Giảng',
                      avatarUrl: null,
                      role: 'TEACHER',
                      studentCode: null,
                      teacherCode: 'GV000001',
                      adminCode: null,
                    })
                    window.location.href = '/teacher'
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors flex items-center gap-2"
                >
                  <UserCheck size={14} className="text-[#10b981]" />
                  <span>Chuyển sang Cổng Giảng viên</span>
                </button>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setOpenUserMenu(false)
                    logout()
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-rose-400 hover:bg-rose-950/40 transition-colors"
                >
                  Đăng xuất Quản trị
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
