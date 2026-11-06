import { Bell, ChevronDown, HelpCircle, Loader2, PanelLeftClose, PanelLeftOpen, RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLogout } from '../../../auth/hooks/useLogout'
import { useSwitchRole } from '../../../auth/hooks/useSwitchRole'
import { useAuthStore } from '../../../store/authStore'
import TeacherNotificationsMenu from '../../teacher/components/TeacherNotificationsMenu'
import type { TeacherNotification } from '../../teacher/api/teacher-notifications.api'
import { useAdminNotifications } from '../hooks/useAdminNotifications'
import { persistentAdminIsCollapsed } from './AdminSidebar'

export default function AdminTopBar() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const { items: notifications, unreadCount, loading, error, load, markRead, markAllRead } = useAdminNotifications(user?.id)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const { logout } = useLogout()
  const { switchRole, isLoading: isSwitching } = useSwitchRole()
  const hasMultipleRoles = (user?.availableRoles?.length ?? 0) >= 2
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

  useEffect(() => {
    if (!openNotifications) return
    const closeOnOutside = (event: MouseEvent) => {
      if (event.target instanceof Node && !notificationsRef.current?.contains(event.target)) setOpenNotifications(false)
    }
    document.addEventListener('mousedown', closeOnOutside)
    return () => document.removeEventListener('mousedown', closeOnOutside)
  }, [openNotifications])

  const selectNotification = (notification: TeacherNotification) => {
    void markRead(notification.id)
    setOpenNotifications(false)
    if (notification.link?.startsWith('/admin/')) navigate(notification.link)
  }

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
          Cổng Quản trị và Giáo vụ
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
        <div ref={notificationsRef} className="relative">
          <button
            onClick={() => { setOpenNotifications((p) => !p); setOpenUserMenu(false) }}
            className="w-8 h-8 rounded-full border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center justify-center relative"
            title="Thông báo Quản trị"
          >
            <Bell size={17} />
            {unreadCount > 0 && <span className="absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-4 text-white ring-2 ring-slate-800">{unreadCount > 99 ? '99+' : unreadCount}</span>}
          </button>

          {openNotifications && (
            <TeacherNotificationsMenu heading="Thông báo quản trị" notifications={notifications} unreadCount={unreadCount}
              loading={loading} error={error} onRetry={() => void load()} onMarkAllRead={() => void markAllRead()}
              onSelect={selectNotification} />
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
                {user?.role === 'EDUCATION_OFFICER' ? 'Giáo vụ' : 'Quản trị viên'}
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
                {hasMultipleRoles && (
                  <button
                    onClick={() => {
                      setOpenUserMenu(false)
                      void switchRole()
                    }}
                    disabled={isSwitching}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-indigo-400 hover:bg-slate-800/60 hover:text-indigo-300 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSwitching ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    <span>{isSwitching ? 'Đang chuyển...' : 'Chuyển vai trò'}</span>
                  </button>
                )}
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
