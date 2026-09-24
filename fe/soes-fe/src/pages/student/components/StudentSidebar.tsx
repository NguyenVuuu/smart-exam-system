import {
  Bell,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Settings,
} from 'lucide-react'
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getSocket } from '../../../api/socket'
import { useLogout } from '../../../auth/hooks/useLogout'
import { useAuthStore } from '../../../store/authStore'
import { useSystemSettingsStore } from '../../../store/systemSettingsStore'
import { getStudentNotifications } from '../api/student-portal.api'

interface NavItem {
  label: string
  icon: React.ReactNode
  path: string
}

interface NavGroup {
  id: string
  title: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'overview',
    title: 'TỔNG QUAN',
    items: [
      { label: 'Trang chủ', icon: <LayoutDashboard size={19} />, path: '/student' },
    ],
  },
  {
    id: 'learning',
    title: 'HỌC TẬP',
    items: [
      { label: 'Lớp học phần', icon: <BookOpen size={19} />, path: '/student/subjects' },
      { label: 'Bài thi', icon: <ClipboardList size={19} />, path: '/student/exams' },
    ],
  },
  {
    id: 'result',
    title: 'KẾT QUẢ',
    items: [
      { label: 'Điểm số', icon: <GraduationCap size={19} />, path: '/student/scores' },
    ],
  },
  {
    id: 'info',
    title: 'THÔNG TIN',
    items: [
      { label: 'Thông báo', icon: <Bell size={19} />, path: '/student/notifications' },
      { label: 'Cài đặt', icon: <Settings size={19} />, path: '/student/settings' },
    ],
  },
]

const ALL_STUDENT_GROUP_IDS = ['overview', 'learning', 'result', 'info']
const STORAGE_KEY_STUDENT_EXPANDED = 'soes_student_expanded_groups'
const STORAGE_KEY_STUDENT_SCROLL = 'soes_student_sidebar_scroll'
const STORAGE_KEY_STUDENT_COLLAPSED = 'soes_student_is_collapsed'

export let persistentStudentIsCollapsed = false

function readSessionStorage(key: string) {
  try {
    return sessionStorage.getItem(key)
  } catch (error) {
    if (error instanceof DOMException) return null
    throw error
  }
}

function writeSessionStorage(key: string, storedValue: string) {
  try {
    sessionStorage.setItem(key, storedValue)
  } catch (error) {
    if (!(error instanceof DOMException)) throw error
  }
}

function getInitialExpandedGroupIds() {
  const storedGroupIds = readSessionStorage(STORAGE_KEY_STUDENT_EXPANDED)
  if (!storedGroupIds) return ALL_STUDENT_GROUP_IDS

  try {
    const parsedGroupIds: unknown = JSON.parse(storedGroupIds)
    const hasValidGroupIds = Array.isArray(parsedGroupIds)
      && parsedGroupIds.every((groupId) => typeof groupId === 'string')
    return hasValidGroupIds ? parsedGroupIds : ALL_STUDENT_GROUP_IDS
  } catch (error) {
    if (error instanceof SyntaxError) return ALL_STUDENT_GROUP_IDS
    throw error
  }
}

function isStudentNavItemActive(pathname: string, itemPath: string) {
  if (itemPath === '/student') return pathname === '/student'
  if (itemPath === '/student/exams') {
    return pathname === itemPath
      || pathname.includes('/exam-schedules/')
      || pathname.endsWith('/take')
      || pathname.endsWith('/result')
  }
  if (itemPath === '/student/subjects') {
    return pathname === itemPath
      || pathname.startsWith('/student/courses/')
      || (pathname.startsWith('/student/course-offerings/') && !pathname.includes('/exam-schedules/'))
  }
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`)
}

export default function StudentSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const { logout } = useLogout()
  const systemSettings = useSystemSettingsStore((state) => state.settings)
  const navRef = useRef<HTMLElement>(null)
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false)

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const storedState = readSessionStorage(STORAGE_KEY_STUDENT_COLLAPSED)
    return storedState === null ? persistentStudentIsCollapsed : storedState === 'true'
  })

  const [expandedGroupIds, setExpandedGroupIds] = useState<string[]>(getInitialExpandedGroupIds)

  useEffect(() => {
    const currentGroup = NAV_GROUPS.find((group) =>
      group.items.some((item) => isStudentNavItemActive(location.pathname, item.path)),
    )
    if (!currentGroup) return

    const expandTimer = window.setTimeout(() => {
      setExpandedGroupIds((currentGroupIds) => {
        if (currentGroupIds.includes(currentGroup.id)) return currentGroupIds
        const nextGroupIds = [...currentGroupIds, currentGroup.id]
        writeSessionStorage(STORAGE_KEY_STUDENT_EXPANDED, JSON.stringify(nextGroupIds))
        return nextGroupIds
      })
    }, 0)
    return () => window.clearTimeout(expandTimer)
  }, [location.pathname])

  useLayoutEffect(() => {
    if (!navRef.current) return
    const storedScrollPosition = readSessionStorage(STORAGE_KEY_STUDENT_SCROLL)
    if (storedScrollPosition) navRef.current.scrollTop = Number(storedScrollPosition) || 0
  }, [location.pathname])

  useEffect(() => {
    const handleToggle = () => {
      setIsCollapsed((prev) => {
        const next = !prev
        persistentStudentIsCollapsed = next
        writeSessionStorage(STORAGE_KEY_STUDENT_COLLAPSED, String(next))
        return next
      })
    }
    window.addEventListener('toggle-sidebar', handleToggle)
    return () => window.removeEventListener('toggle-sidebar', handleToggle)
  }, [])

  useEffect(() => {
    persistentStudentIsCollapsed = isCollapsed
    writeSessionStorage(STORAGE_KEY_STUDENT_COLLAPSED, String(isCollapsed))
  }, [isCollapsed])

  useEffect(() => {
    let active = true
    const refreshUnread = () => {
      void getStudentNotifications({ page: 1, pageSize: 1, unreadOnly: true })
        .then((data) => {
          if (active) setHasUnreadNotifications(data.pagination.totalItems > 0)
        })
        .catch(() => {
          if (active) setHasUnreadNotifications(false)
        })
    }
    const handleNotificationCreated = () => setHasUnreadNotifications(true)

    refreshUnread()
    const socket = getSocket()
    socket.on('notification:created', handleNotificationCreated)
    window.addEventListener('student-notifications:changed', refreshUnread)
    return () => {
      active = false
      socket.off('notification:created', handleNotificationCreated)
      window.removeEventListener('student-notifications:changed', refreshUnread)
    }
  }, [])

  const toggleGroup = (groupId: string) => {
    setExpandedGroupIds((currentGroupIds) => {
      const nextGroupIds = currentGroupIds.includes(groupId)
        ? currentGroupIds.filter((id) => id !== groupId)
        : [...currentGroupIds, groupId]
      writeSessionStorage(STORAGE_KEY_STUDENT_EXPANDED, JSON.stringify(nextGroupIds))
      return nextGroupIds
    })
  }

  const handleNavScroll = (event: React.UIEvent<HTMLElement>) => {
    writeSessionStorage(STORAGE_KEY_STUDENT_SCROLL, String(event.currentTarget.scrollTop))
  }

  const initials = getInitials(user?.fullName)

  return (
    <aside
      className={`${
        isCollapsed ? 'w-16' : 'w-[256px]'
      } z-10 flex shrink-0 select-none flex-col overflow-hidden border-r border-gray-100 bg-white font-sans text-slate-600 transition-[width] duration-200 ease-in-out`}
    >
      <div className={`h-16 flex items-center border-b border-gray-100 shrink-0 overflow-hidden whitespace-nowrap ${
        isCollapsed ? 'justify-center px-0' : 'px-4'
      }`}>
        <div className={`flex items-center shrink-0 min-w-0 ${isCollapsed ? 'justify-center w-full' : 'gap-3'}`}>
          {systemSettings.logoUrl ? (
            <img
              src={systemSettings.logoUrl}
              alt="Logo"
              className={`${isCollapsed ? 'w-10 h-10' : 'w-11 h-11'} object-contain shrink-0 mx-auto`}
            />
          ) : (
            <div className={`${isCollapsed ? 'w-10 h-10 text-lg' : 'w-11 h-11 text-xl'} rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center shadow-md shadow-blue-200/50 shrink-0 mx-auto`}>
              {systemSettings.shortName?.[0] || 'S'}
            </div>
          )}
          {!isCollapsed && (
            <div className="flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap">
              <span className="text-xl font-bold text-gray-900 tracking-tight truncate max-w-[110px]" title={systemSettings.organizationName}>
                {systemSettings.shortName || 'SOES'}
              </span>
              <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase shrink-0">
                Sinh viên
              </span>
            </div>
          )}
        </div>
      </div>

      <nav
        ref={navRef}
        onScroll={handleNavScroll}
        className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-3 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {NAV_GROUPS.map((group, groupIndex) => {
          const isGroupExpanded = expandedGroupIds.includes(group.id)

          return (
            <div key={group.id} className="space-y-1">
              {!isCollapsed ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="flex w-full items-center justify-between overflow-hidden whitespace-nowrap px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 transition-colors hover:text-slate-700 cursor-pointer"
                  title={`${isGroupExpanded ? 'Thu gọn' : 'Mở rộng'} nhóm ${group.title}`}
                >
                  <span className="truncate">{group.title}</span>
                  {isGroupExpanded ? (
                    <ChevronDown size={14} className="shrink-0 text-gray-400" />
                  ) : (
                    <ChevronRight size={14} className="shrink-0 text-gray-400" />
                  )}
                </button>
              ) : (
                groupIndex > 0 && <div className="my-2 border-t border-gray-100" />
              )}

              {(!isCollapsed ? isGroupExpanded : true) && (
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = isStudentNavItemActive(location.pathname, item.path)

                    return (
                      <button
                        type="button"
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        title={isCollapsed ? item.label : undefined}
                        className={`flex w-full items-center overflow-hidden whitespace-nowrap rounded-xl text-sm font-medium transition-all cursor-pointer ${
                          isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3.5 py-2.5'
                        } ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-semibold'
                            : 'text-slate-600 hover:bg-gray-50 hover:text-slate-900'
                        }`}
                      >
                        <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                          {item.icon}
                          {item.path === '/student/notifications' && hasUnreadNotifications && (
                            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-rose-500" />
                          )}
                        </span>
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {!isCollapsed && (
        <div className="shrink-0 border-t border-gray-100 p-3">
          <div className="flex items-center justify-between rounded-xl bg-gray-50 p-2 transition-colors hover:bg-gray-100">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-950">
                  {user?.fullName ?? 'Sinh viên'}
                </p>
                <p className="truncate text-[11px] font-normal text-slate-500">
                  {user?.studentCode || 'Sinh viên'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              title="Đăng xuất"
              className="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:text-rose-600 cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}

function getInitials(name?: string | null) {
  if (!name) return 'SV'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'SV'
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''
  return `${first}${last}`.toLocaleUpperCase('vi')
}
