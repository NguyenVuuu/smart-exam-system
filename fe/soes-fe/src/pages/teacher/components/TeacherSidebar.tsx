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
  ShieldAlert,
} from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

interface SubNavItem {
  label: string
  icon: React.ReactNode
  path: string
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
      { label: 'Trang chủ', icon: <LayoutDashboard size={20} />, path: '/teacher' },
      { label: 'Lớp học phần', icon: <BookOpen size={20} />, path: '/teacher/courses' },
    ],
  },
  {
    id: 'questions',
    title: 'CÂU HỎI',
    items: [
      { label: 'Ngân hàng câu hỏi', icon: <Database size={20} />, path: '/teacher/question-bank' },
      { label: 'Rà soát câu hỏi', icon: <AlertCircle size={20} />, path: '/teacher/question-audit' },
    ],
  },
  {
    id: 'exams',
    title: 'BÀI THI / ĐỀ THI',
    items: [
      { label: 'Quản lý đề thi', icon: <ClipboardList size={20} />, path: '/teacher/exams' },
      { label: 'Sinh đề tự động', icon: <Layers size={20} />, path: '/teacher/exams/auto-generator' },
    ],
  },
  {
    id: 'reports',
    title: 'KHẢO THÍ & BÁO CÁO',
    items: [
      { label: 'Giám sát ca thi', icon: <ShieldAlert size={20} />, path: '/teacher/proctoring' },
      { label: 'Thống kê phổ điểm', icon: <FileSpreadsheet size={20} />, path: '/teacher/grading-reports' },
    ],
  },
]

// Module-level persistent state across page unmount/remount
export let persistentTeacherIsCollapsed: boolean = false
let persistentTeacherExpandedGroupIds: string[] | null = null

export default function TeacherSidebar() {
  const navigate = useNavigate()
  const location = useLocation()

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

  // Determine initial active group based on route
  const initialActiveGroup = NAV_GROUPS.find((g) =>
    g.items.some((item) => isNavItemActive(item.path)),
  )

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => persistentTeacherIsCollapsed)
  const [expandedGroupIds, setExpandedGroupIds] = useState<string[]>(() => {
    if (persistentTeacherExpandedGroupIds && persistentTeacherExpandedGroupIds.length > 0) {
      return persistentTeacherExpandedGroupIds
    }
    return [initialActiveGroup?.id || 'overview']
  })

  const prevPathnameRef = useRef(location.pathname)

  // Listen to global toggle-sidebar custom event
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

  // Sync collapse state to module variable
  useEffect(() => {
    persistentTeacherIsCollapsed = isCollapsed
  }, [isCollapsed])

  // Auto-expand active group ONLY when navigating to a new route
  useEffect(() => {
    if (prevPathnameRef.current !== location.pathname) {
      prevPathnameRef.current = location.pathname
      const activeGroup = NAV_GROUPS.find((g) =>
        g.items.some((item) => isNavItemActive(item.path)),
      )
      if (activeGroup) {
        setExpandedGroupIds((prev) => {
          if (prev.includes(activeGroup.id)) return prev
          const next = [...prev, activeGroup.id]
          persistentTeacherExpandedGroupIds = next
          return next
        })
      }
    }
  }, [location.pathname])

  const toggleGroup = (groupId: string) => {
    setExpandedGroupIds((prev) => {
      const next = prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
      persistentTeacherExpandedGroupIds = next
      return next
    })
  }

  return (
    <aside
      className={`${
        isCollapsed ? 'w-16' : 'w-60'
      } shrink-0 bg-white border-r border-gray-100 flex flex-col font-sans transition-[width] duration-300 ease-in-out overflow-hidden`}
    >
      {/* Logo Header: Fixed logo position, smooth right-to-left collapse */}
      <div className="h-16 flex items-center px-3.5 border-b border-gray-100 shrink-0 overflow-hidden whitespace-nowrap">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-base flex items-center justify-center shadow-md shadow-blue-200/50 shrink-0">
            S
          </div>
          {!isCollapsed && (
            <div className="flex items-center gap-2.5 overflow-hidden whitespace-nowrap animate-in fade-in duration-200">
              <span className="text-lg font-bold text-gray-900 tracking-tight">SOES</span>
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase shrink-0">
                Giảng viên
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 py-4 px-2.5 space-y-3 overflow-y-auto overflow-x-hidden">
        {NAV_GROUPS.map((group, groupIdx) => {
          const isGroupExpanded = expandedGroupIds.includes(group.id)

          return (
            <div key={group.id} className="space-y-1">
              {!isCollapsed ? (
                /* Expandable Group Accordion Header */
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider hover:text-gray-700 transition-colors overflow-hidden whitespace-nowrap"
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

              {/* Items List - Rendered when expanded or in collapsed mode */}
              {(!isCollapsed ? isGroupExpanded : true) && (
                <div className="space-y-1">
                  {group.items.map((subItem) => {
                    const isActive = isNavItemActive(subItem.path)

                    return (
                      <button
                        key={subItem.path}
                        onClick={() => navigate(subItem.path)}
                        title={isCollapsed ? subItem.label : undefined}
                        className={`w-full flex items-center gap-3.5 px-3 py-2.5 text-xs font-bold rounded-xl transition-all overflow-hidden whitespace-nowrap ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-200/50 font-bold'
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
    </aside>
  )
}
