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
import React, { useEffect, useMemo, useState } from 'react'
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

export let persistentTeacherIsCollapsed: boolean = false
let persistentTeacherExpandedGroupIds: string[] | null = null

export default function TeacherSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const { logout } = useLogout()
  const permissions = useAuthStore((state) => state.user?.permissions ?? EMPTY_PERMISSIONS)
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

  const initialActiveGroup = navGroups.find((g) =>
    g.items.some((item) => isNavItemActive(item.path)),
  )

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => persistentTeacherIsCollapsed)
  const [expandedGroupIds, setExpandedGroupIds] = useState<string[]>(() => {
    if (persistentTeacherExpandedGroupIds && persistentTeacherExpandedGroupIds.length > 0) {
      return persistentTeacherExpandedGroupIds
    }
    return [initialActiveGroup?.id || 'overview', 'questions', 'exams']
  })

  useEffect(() => {
    const handleToggle = () => {
      setIsCollapsed((prev) => {
        const next = !prev
        persistentTeacherIsCollapsed = next
        return next
      })
    }
    window.addEventListener('toggle-sidebar', handleToggle)
    return () => window.removeEventListener('toggle-sidebar', handleToggle)
  }, [])

  useEffect(() => {
    persistentTeacherIsCollapsed = isCollapsed
  }, [isCollapsed])

  const toggleGroup = (groupId: string) => {
    setExpandedGroupIds((prev) => {
      const next = prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
      persistentTeacherExpandedGroupIds = next
      return next
    })
  }

  return (
    <aside
      className={`${isCollapsed ? 'w-16' : 'w-64'
        } shrink-0 bg-white border-r border-gray-100 flex flex-col font-sans transition-[width] duration-300 ease-in-out overflow-hidden`}
    >
      {/* Restored Original Logo Header */}
      <div className="h-16 flex items-center px-4 border-b border-gray-100 shrink-0 overflow-hidden whitespace-nowrap">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-base flex items-center justify-center shadow-md shadow-blue-200/50 shrink-0">
            S
          </div>
          {!isCollapsed && (
            <div className="flex items-center gap-2.5 overflow-hidden whitespace-nowrap animate-in fade-in duration-200">
              <span className="text-lg font-bold text-gray-900 tracking-tight">SOES</span>
              <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase shrink-0">
                Giảng viên
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 py-4 px-3 space-y-3 overflow-y-auto overflow-x-hidden">
        {navGroups.map((group, groupIdx) => {
          const isGroupExpanded = expandedGroupIds.includes(group.id)

          return (
            <div key={group.id} className="space-y-1">
              {!isCollapsed ? (
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-700 transition-colors overflow-hidden whitespace-nowrap"
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
                <div className="space-y-1">
                  {group.items.map((subItem) => {
                    const isActive = isNavItemActive(subItem.path)

                    return (
                      <button
                        key={subItem.path}
                        onClick={() => navigate(subItem.path)}
                        title={isCollapsed ? subItem.label : undefined}
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center gap-0 px-0 py-2.5' : 'gap-3 px-3.5 py-2.5'
                          } text-sm font-medium rounded-xl transition-all overflow-hidden whitespace-nowrap ${isActive
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                      >
                        <span className="shrink-0 flex items-center justify-center w-5 h-5">{subItem.icon}</span>
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
                <p className="text-xs font-semibold text-gray-900 truncate">
                  {user?.fullName ?? 'Nguyễn Văn An'}
                </p>
                <p className="text-[11px] text-gray-500 truncate">Giảng viên</p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Đăng xuất"
              className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg transition-colors shrink-0"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
