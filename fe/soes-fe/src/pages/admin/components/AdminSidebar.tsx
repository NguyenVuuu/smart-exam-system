import {
  BarChart3,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronRight,
  Database,
  FileCheck,
  GraduationCap,
  Home,
  LogOut,
  ScrollText,
  Settings,
  ShieldAlert,
  Users,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLogout } from '../../../auth/hooks/useLogout'
import { useAuthStore } from '../../../store/authStore'

interface SubNavItem {
  label: string
  icon: ReactNode
  path: string
  badgeCount?: number
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
      { label: 'Dashboard', icon: <Home size={18} />, path: '/admin' },
    ],
  },
  {
    id: 'academic',
    title: 'HỌC VỤ',
    items: [
      { label: 'Học kỳ và Năm học', icon: <Calendar size={18} />, path: '/admin/academic' },
      { label: 'Bộ môn và Môn học', icon: <BookOpen size={18} />, path: '/admin/academic-structure' },
      { label: 'Lớp học phần và Xếp lớp', icon: <GraduationCap size={18} />, path: '/admin/class-sections' },
      { label: 'Người dùng và Tài khoản', icon: <Users size={18} />, path: '/admin/users' },
    ],
  },
  {
    id: 'expertise',
    title: 'CHUYÊN MÔN',
    items: [
      {
        label: 'Ngân hàng câu hỏi chung',
        icon: <Database size={18} />,
        path: '/admin/shared-question-bank',
      },
      {
        label: 'Theo dõi đề thi',
        icon: <FileCheck size={18} />,
        path: '/admin/exams',
      },
    ],
  },
  {
    id: 'proctoring',
    title: 'TỔ CHỨC THI',
    items: [
      { label: 'Lịch thi và Phân công', icon: <Calendar size={18} />, path: '/admin/exam-schedules' },
      { label: 'Giám sát thi', icon: <ShieldAlert size={18} />, path: '/admin/proctoring' },
    ],
  },
  {
    id: 'reports',
    title: 'BÁO CÁO',
    items: [
      { label: 'Báo cáo', icon: <BarChart3 size={18} />, path: '/admin/reports' },
    ],
  },
  {
    id: 'system',
    title: 'HỆ THỐNG',
    items: [
      { label: 'Audit Log', icon: <ScrollText size={18} />, path: '/admin/audit-logs' },
      { label: 'Cấu hình', icon: <Settings size={18} />, path: '/admin/settings' },
    ],
  },
]

export let persistentAdminIsCollapsed: boolean = false
let persistentAdminExpandedGroupIds: string[] | null = null

export default function AdminSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const { logout } = useLogout()

  const isNavItemActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin'
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  const initialActiveGroup = NAV_GROUPS.find((g) =>
    g.items.some((item) => isNavItemActive(item.path)),
  )

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => persistentAdminIsCollapsed)
  const [expandedGroupIds, setExpandedGroupIds] = useState<string[]>(() => {
    if (persistentAdminExpandedGroupIds && persistentAdminExpandedGroupIds.length > 0) {
      return persistentAdminExpandedGroupIds
    }
    return [
      initialActiveGroup?.id || 'overview',
      'academic',
      'expertise',
      'proctoring',
      'reports',
      'system',
    ]
  })

  useEffect(() => {
    const handleToggle = () => {
      setIsCollapsed((prev) => {
        const next = !prev
        persistentAdminIsCollapsed = next
        return next
      })
    }
    window.addEventListener('toggle-sidebar', handleToggle)
    return () => window.removeEventListener('toggle-sidebar', handleToggle)
  }, [])

  useEffect(() => {
    persistentAdminIsCollapsed = isCollapsed
  }, [isCollapsed])

  const toggleGroup = (groupId: string) => {
    setExpandedGroupIds((prev) => {
      const next = prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
      persistentAdminExpandedGroupIds = next
      return next
    })
  }

  return (
    <aside
      style={{ backgroundColor: 'rgb(30, 41, 59)' }}
      className={`${
        isCollapsed ? 'w-16' : 'w-[256px]'
      } shrink-0 border-r border-slate-700/60 flex flex-col font-sans transition-[width] duration-200 ease-in-out overflow-hidden select-none z-10 text-slate-300`}
    >
      {/* Logo Header */}
      <div className="h-16 flex items-center px-4 border-b border-slate-700/60 shrink-0 overflow-hidden whitespace-nowrap">
        <div className="flex items-center gap-2.5 shrink-0 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#10b981] text-white font-bold text-base flex items-center justify-center shadow-md shadow-[#10b981]/30 shrink-0">
            S
          </div>
          {!isCollapsed && (
            <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap min-w-0">
              <span className="text-lg font-bold text-white tracking-tight">SOES</span>
              <span className="text-[11px] font-semibold text-[#10b981] bg-[#10b981]/15 px-2 py-0.5 rounded-md uppercase shrink-0 border border-[#10b981]/30">
                Quản trị viên
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Nav Groups - Parent / Child Collapsible */}
      <nav className="flex-1 py-3 px-3 space-y-3 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {NAV_GROUPS.map((group, groupIdx) => {
          const isGroupExpanded = expandedGroupIds.includes(group.id)

          return (
            <div key={group.id} className="space-y-1">
              {!isCollapsed ? (
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-3 py-1 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-200 transition-colors overflow-hidden whitespace-nowrap cursor-pointer"
                  title={`${isGroupExpanded ? 'Thu gọn' : 'Mở rộng'} danh mục ${group.title}`}
                >
                  <span className="truncate">{group.title}</span>
                  {isGroupExpanded ? (
                    <ChevronDown size={14} className="shrink-0 text-slate-400" />
                  ) : (
                    <ChevronRight size={14} className="shrink-0 text-slate-400" />
                  )}
                </button>
              ) : (
                groupIdx > 0 && <div className="border-t border-slate-700/60 my-2" />
              )}

              {(!isCollapsed ? isGroupExpanded : true) && (
                <div className="space-y-0.5">
                  {group.items.map((subItem) => {
                    const isActive = isNavItemActive(subItem.path)

                    return (
                      <button
                        key={subItem.path}
                        onClick={() => navigate(subItem.path)}
                        title={isCollapsed ? subItem.label : undefined}
                        className={`w-full flex items-center justify-between ${
                          isCollapsed ? 'justify-center px-0 py-2.5' : 'px-3.5 py-2.5'
                        } text-sm font-medium rounded-xl transition-all overflow-hidden whitespace-nowrap cursor-pointer ${
                          isActive
                            ? 'bg-[#10b981] text-white shadow-xs'
                            : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="shrink-0 flex items-center justify-center w-5 h-5">
                            {subItem.icon}
                          </span>
                          {!isCollapsed && <span className="truncate">{subItem.label}</span>}
                        </div>

                        {!isCollapsed && subItem.badgeCount !== undefined && (
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0 ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-[#10b981]/20 text-[#10b981]'
                            }`}
                          >
                            {subItem.badgeCount}
                          </span>
                        )}
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
      <div className="p-3 border-t border-slate-700/60 shrink-0">
        <div className={`flex items-center ${isCollapsed ? 'justify-center p-1' : 'justify-between p-2.5'} rounded-xl bg-slate-900/60 hover:bg-slate-900/90 transition-colors`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#e11d48] text-white font-bold text-xs flex items-center justify-center shrink-0">
              TQ
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.fullName ?? 'Trần Quang Huy'}
                </p>
                <p className="text-[11px] text-slate-400 font-normal truncate">Quản trị viên</p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={() => logout()}
              title="Đăng xuất"
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
