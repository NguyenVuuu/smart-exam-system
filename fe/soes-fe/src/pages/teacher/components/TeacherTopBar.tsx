import { Bell, ChevronDown, HelpCircle, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLogout } from '../../../auth/hooks/useLogout'
import { useAuthStore } from '../../../store/authStore'
import type { TeacherNotification } from '../api/teacher-notifications.api'
import { useTeacherNotifications } from '../hooks/useTeacherNotifications'
import TeacherNotificationsMenu from './TeacherNotificationsMenu'
import { persistentTeacherIsCollapsed } from './TeacherSidebar'

export default function TeacherTopBar() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const { logout } = useLogout()
  const { items: notifications, unreadCount, loading, error, load, markRead, markAllRead } = useTeacherNotifications()
  const [openUserMenu, setOpenUserMenu] = useState(false)
  const [openNotifications, setOpenNotifications] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => persistentTeacherIsCollapsed)
  const notificationsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleToggle = () => {
      setIsSidebarCollapsed((prev) => !prev)
    }
    window.addEventListener('toggle-sidebar', handleToggle)
    return () => window.removeEventListener('toggle-sidebar', handleToggle)
  }, [])

  useEffect(() => {
    if (!openNotifications) return

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !notificationsRef.current?.contains(event.target)) {
        setOpenNotifications(false)
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenNotifications(false)
    }

    document.addEventListener('mousedown', closeOnOutsideClick)
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [openNotifications])

  const selectNotification = (notification: TeacherNotification) => {
    void markRead(notification.id)
    setOpenNotifications(false)
    if (notification.title.toLocaleLowerCase('vi').includes('phúc khảo')) {
      navigate('/teacher/grading-reports?tab=appeals')
    }
  }

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
        <div ref={notificationsRef} className="relative">
          <button
            onClick={() => {
              setOpenNotifications((current) => !current)
              setOpenUserMenu(false)
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-gray-100 hover:text-slate-800"
            title="Thông báo"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute right-0 top-0 inline-flex min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-4 text-white ring-2 ring-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {openNotifications && (
            <TeacherNotificationsMenu
              notifications={notifications.slice(0, 5)}
              unreadCount={unreadCount}
              loading={loading}
              error={error}
              onMarkAllRead={() => void markAllRead()}
              onRetry={() => void load()}
              onSelect={selectNotification}
              onViewAll={() => {
                setOpenNotifications(false)
                navigate('/teacher/grading-reports?tab=notifications')
              }}
            />
          )}
        </div>

        {/* User Account */}
        <div className="relative">
          <button
            onClick={() => {
              setOpenUserMenu((current) => !current)
              setOpenNotifications(false)
            }}
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
