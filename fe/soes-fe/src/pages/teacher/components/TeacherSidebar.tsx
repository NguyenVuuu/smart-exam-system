import {
  AlertCircle,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Database,
  FileSpreadsheet,
  Layers,
  LayoutDashboard,
  LogOut,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLogout } from '../../../auth/hooks/useLogout'
import { useAuthStore } from '../../../store/authStore'
import type { UserPermission } from '../../../types/auth.types'

interface SubNavItem {
  label: string
  icon: React.ReactNode
  path: string
  requiredPermissions?: UserPermission[]
}

interface NavGroup {
  id: string
  title: string
  items: SubNavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'overview',
    title: 'TỔNG QUAN',
    items: [
      { label: 'Trang chủ', icon: <LayoutDashboard size={19} />, path: '/teacher' },
      { label: 'Lớp học phần', icon: <BookOpen size={19} />, path: '/teacher/courses' },
    ],
  },
  {
    id: 'questions',
    title: 'CÂU HỎI',
    items: [
      { label: 'Ngân hàng câu hỏi', icon: <Database size={19} />, path: '/teacher/question-bank' },
      { label: 'Rà soát câu hỏi', icon: <AlertCircle size={19} />, path: '/teacher/question-audit' },
    ],
  },
  {
    id: 'exams',
    title: 'BÀI THI / ĐỀ THI',
    items: [
      { label: 'Quản lý đề thi', icon: <ClipboardList size={19} />, path: '/teacher/exams' },
      { label: 'Sinh đề tự động', icon: <Layers size={19} />, path: '/teacher/exams/auto-generator' },
    ],
  },
  {
    id: 'reports',
    title: 'KHẢO THÍ & BÁO CÁO',
    items: [
      { label: 'Giám sát ca thi', icon: <ShieldAlert size={19} />, path: '/teacher/proctoring' },
      { label: 'Thống kê phổ điểm', icon: <FileSpreadsheet size={19} />, path: '/teacher/grading-reports' },
    ],
  },
  {
    id: 'department-approval',
    title: 'BỘ MÔN',
    items: [
      {
        label: 'Duyệt chuyên môn',
        icon: <ShieldCheck size={19} />,
        path: '/teacher/department-approvals',
        requiredPermissions: ['APPROVE_SHARED_QUESTION', 'APPROVE_FINAL_EXAM'],
      },
    ],
  },
]

const EMPTY_PERMISSIONS: UserPermission[] = []
const ALL_TEACHER_GROUP_IDS = ['overview', 'questions', 'exams', 'reports', 'department-approval']
const STORAGE_KEY_TEACHER_EXPANDED = 'soes_teacher_expanded_groups'
const STORAGE_KEY_TEACHER_SCROLL = 'soes_teacher_sidebar_scroll'
const STORAGE_KEY_TEACHER_COLLAPSED = 'soes_teacher_is_collapsed'

export let persistentTeacherIsCollapsed: boolean = false

export default function TeacherSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const { logout } = useLogout()
  const permissions = useAuthStore((state) => state.user?.permissions ?? EMPTY_PERMISSIONS)
  const navRef = useRef<HTMLElement>(null)

  const navGroups = useMemo(
    () =>
      NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            !item.requiredPermissions ||
            item.requiredPermissions.some((permission) => permissions.includes(permission)),
        ),
      })).filter((group) => group.items.length > 0),
    [permissions],
  )

  const isNavItemActive = (path: string) => {
    if (path === '/teacher') return location.pathname === '/teacher'
    if (path === '/teacher/exams') {
      return (
        location.pathname === '/teacher/exams' ||
        location.pathname === '/teacher/exams/create' ||
        /^\/teacher\/exams\/(?!auto-generator(?:\/|$))[^/]+(\/edit)?$/.test(location.pathname)
      )
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_TEACHER_COLLAPSED)
      if (saved !== null) return saved === 'true'
    } catch {}
    return persistentTeacherIsCollapsed
  })

  const [expandedGroupIds, setExpandedGroupIds] = useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_TEACHER_EXPANDED)
      if (saved !== null) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) return parsed
      }
    } catch {}
    return ALL_TEACHER_GROUP_IDS
  })

  // Khi route thay đổi: chỉ mở nhóm của route đang active nếu chưa mở, giữ nguyên các nhóm khác
  useEffect(() => {
    const currentGroup = navGroups.find((g) =>
      g.items.some((item) => isNavItemActive(item.path)),
    )
    if (currentGroup) {
      setExpandedGroupIds((prev) => {
        if (prev.includes(currentGroup.id)) return prev
        const next = [...prev, currentGroup.id]
        try {
          sessionStorage.setItem(STORAGE_KEY_TEACHER_EXPANDED, JSON.stringify(next))
        } catch {}
        return next
      })
    }
  }, [location.pathname, navGroups])

  // Khôi phục vị trí scroll ngay khi render
  useLayoutEffect(() => {
    if (navRef.current) {
      try {
        const savedScroll = sessionStorage.getItem(STORAGE_KEY_TEACHER_SCROLL)
        if (savedScroll) {
          navRef.current.scrollTop = Number(savedScroll) || 0
        }
      } catch {}
    }
  }, [location.pathname])

  useEffect(() => {
    const handleToggle = () => {
      setIsCollapsed((prev) => {
        const next = !prev
        persistentTeacherIsCollapsed = next
        try {
          sessionStorage.setItem(STORAGE_KEY_TEACHER_COLLAPSED, String(next))
        } catch {}
        return next
      })
    }
    window.addEventListener('toggle-sidebar', handleToggle)
    return () => window.removeEventListener('toggle-sidebar', handleToggle)
  }, [])

  useEffect(() => {
    persistentTeacherIsCollapsed = isCollapsed
    try {
      sessionStorage.setItem(STORAGE_KEY_TEACHER_COLLAPSED, String(isCollapsed))
    } catch {}
  }, [isCollapsed])

  const toggleGroup = (groupId: string) => {
    setExpandedGroupIds((prev) => {
      const next = prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
      try {
        sessionStorage.setItem(STORAGE_KEY_TEACHER_EXPANDED, JSON.stringify(next))
      } catch {}
      return next
    })
  }

  const handleNavScroll = (e: React.UIEvent<HTMLElement>) => {
    try {
      sessionStorage.setItem(STORAGE_KEY_TEACHER_SCROLL, String(e.currentTarget.scrollTop))
    } catch {}
  }

  return (
    <aside
      className={`${
        isCollapsed ? 'w-16' : 'w-[256px]'
      } z-10 flex shrink-0 select-none flex-col overflow-hidden border-r border-gray-100 bg-white font-sans text-slate-600 transition-[width] duration-200 ease-in-out`}
    >
      {/* Restored Original Logo Header */}
      <div className="h-16 flex items-center px-4 border-b border-gray-100 shrink-0 overflow-hidden whitespace-nowrap">
        <div className="flex min-w-0 shrink-0 items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-base flex items-center justify-center shadow-md shadow-blue-200/50 shrink-0">
            S
          </div>
          {!isCollapsed && (
            <div className="flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap">
              <span className="text-lg font-bold text-gray-900 tracking-tight">SOES</span>
              <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase shrink-0">
                Giảng viên
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Nav Groups */}
      <nav
        ref={navRef}
        onScroll={handleNavScroll}
        className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-3 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {navGroups.map((group, groupIdx) => {
          const isGroupExpanded = expandedGroupIds.includes(group.id)

          return (
            <div key={group.id} className="space-y-1">
              {!isCollapsed ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="flex w-full items-center justify-between overflow-hidden whitespace-nowrap px-3 py-1 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 transition-colors hover:text-slate-700 cursor-pointer"
                  title={`${isGroupExpanded ? 'Thu gọn' : 'Mở rộng'} cụm ${group.title}`}
                >
                  <span className="truncate">{group.title}</span>
                  {isGroupExpanded ? (
                    <ChevronDown size={14} className="shrink-0 text-gray-400" />
                  ) : (
                    <ChevronRight size={14} className="shrink-0 text-gray-400" />
                  )}
                </button>
              ) : (
                groupIdx > 0 && <div className="border-t border-gray-100 my-2" />
              )}

              {(!isCollapsed ? isGroupExpanded : true) && (
                <div className="space-y-0.5">
                  {group.items.map((subItem) => {
                    const isActive = isNavItemActive(subItem.path)

                    return (
                      <button
                        type="button"
                        key={subItem.path}
                        onClick={() => navigate(subItem.path)}
                        title={isCollapsed ? subItem.label : undefined}
                        className={`flex w-full items-center overflow-hidden whitespace-nowrap rounded-xl text-sm font-medium transition-all cursor-pointer ${
                          isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3.5 py-2.5'
                        } ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                            : 'text-slate-600 hover:bg-gray-50 hover:text-slate-900'
                        }`}
                      >
                        <span className="shrink-0 flex items-center justify-center w-5 h-5">
                          {subItem.icon}
                        </span>
                        {!isCollapsed && <span className="truncate">{subItem.label}</span>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Bottom Profile Section */}
      {!isCollapsed && (
        <div className="p-3 border-t border-gray-100 shrink-0">
          <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-semibold text-xs flex items-center justify-center shrink-0">
                NV
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-950">
                  {user?.fullName ?? 'Nguyễn Văn An'}
                </p>
                <p className="truncate text-[11px] font-normal text-slate-500">Giảng viên</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              title="Đăng xuất"
              className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
