import {
  Bell,
  ChevronDown,
  HelpCircle,
  KeyRound,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  UserRound,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLogout } from '../../../auth/hooks/useLogout'
import { useAuthStore } from '../../../store/authStore'
import type { TeacherNotification } from '../api/teacher-notifications.api'
import { useTeacherNotifications } from '../hooks/useTeacherNotifications'
import { getTeacherInitials, getTeacherPositionLabel } from '../utils/teacher-account.utils'
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
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleToggle = () => {
      setIsSidebarCollapsed((prev) => !prev)
    }
    window.addEventListener('toggle-sidebar', handleToggle)
    return () => window.removeEventListener('toggle-sidebar', handleToggle)
  }, [])

  useEffect(() => {
    if (!openNotifications && !openUserMenu) return

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return
      if (!notificationsRef.current?.contains(event.target)) setOpenNotifications(false)
      if (!userMenuRef.current?.contains(event.target)) setOpenUserMenu(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpenNotifications(false)
      setOpenUserMenu(false)
    }

    document.addEventListener('mousedown', closeOnOutsideClick)
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [openNotifications, openUserMenu])

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
        <div ref={userMenuRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setOpenUserMenu((current) => !current)
              setOpenNotifications(false)
            }}
            aria-expanded={openUserMenu}
            aria-haspopup="menu"
            className="flex items-center gap-2.5 rounded-full p-1 pr-2.5 transition-colors hover:bg-gray-50"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-xs">
              {getTeacherInitials(user?.fullName)}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold leading-tight text-slate-950">
                {user?.fullName ?? 'Giảng viên'}
              </p>
              <p className="mt-0.5 text-[11px] font-normal leading-none text-slate-500">
                {getTeacherPositionLabel(user?.position)}
              </p>
            </div>
            <ChevronDown size={14} className="text-gray-400 ml-1" />
          </button>

          {openUserMenu && (
            <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-gray-100 bg-white p-2 font-sans shadow-2xl shadow-slate-900/10 animate-in fade-in zoom-in-95 duration-150" role="menu">
              {/* Header profile info */}
              <div className="flex items-center gap-3 rounded-xl bg-gray-50/80 p-3 border border-gray-100/80 mb-1.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-xs font-bold text-white shadow-xs">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full rounded-xl object-cover" />
                  ) : (
                    getTeacherInitials(user?.fullName)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-gray-900 leading-tight">
                    {user?.fullName ?? 'Giảng viên'}
                  </p>
                  <p className="truncate text-xs text-gray-500 mt-0.5 font-normal">
                    {user?.email || user?.teacherCode || 'Tài khoản giảng viên'}
                  </p>
                  <span className="mt-1 inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-100">
                    {getTeacherPositionLabel(user?.position)}
                  </span>
                </div>
              </div>

              {/* Menu items */}
              <div className="space-y-0.5">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpenUserMenu(false)
                    navigate('/teacher/account')
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 hover:text-blue-600 cursor-pointer group"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <UserRound size={15} />
                  </div>
                  <span>Hồ sơ cá nhân</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpenUserMenu(false)
                    navigate('/teacher/account?tab=security')
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 hover:text-blue-600 cursor-pointer group"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <KeyRound size={15} />
                  </div>
                  <span>Đổi mật khẩu</span>
                </button>
              </div>

              {/* Logout button */}
              <div className="mt-1.5 border-t border-gray-100 pt-1.5">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpenUserMenu(false)
                    logout()
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 cursor-pointer group"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 group-hover:bg-rose-100 transition-colors">
                    <LogOut size={15} />
                  </div>
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
