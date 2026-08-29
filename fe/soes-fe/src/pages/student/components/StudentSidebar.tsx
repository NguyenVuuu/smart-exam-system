import {
  Bell,
  BookOpen,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Settings,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

interface NavItem {
  label: string
  icon: React.ReactNode
  path: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/student' },
  { label: 'Môn học', icon: <BookOpen size={18} />, path: '/student/subjects' },
  { label: 'Bài thi', icon: <ClipboardList size={18} />, path: '/student/exams' },
  { label: 'Tài liệu', icon: <FileText size={18} />, path: '/student/materials' },
  { label: 'Thông báo', icon: <Bell size={18} />, path: '/student/notifications' },
  { label: 'Cài đặt', icon: <Settings size={18} />, path: '/student/settings' },
]

// Module-level persistent state across page unmount/remount
export let persistentStudentIsCollapsed: boolean = false

export default function StudentSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState<boolean>(
    () => persistentStudentIsCollapsed || window.matchMedia('(max-width: 767px)').matches,
  )

  // Listen to global toggle-sidebar custom event
  useEffect(() => {
    const handleToggle = () => {
      setIsCollapsed((prev) => {
        const next = !prev
        persistentStudentIsCollapsed = next
        return next
      })
    }
    window.addEventListener('toggle-sidebar', handleToggle)
    return () => window.removeEventListener('toggle-sidebar', handleToggle)
  }, [])

  useEffect(() => {
    persistentStudentIsCollapsed = isCollapsed
  }, [isCollapsed])

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
                Sinh viên
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2.5 space-y-1 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map((item) => {
          const isExamRoute = location.pathname.startsWith('/student/course-offerings/') && location.pathname.includes('/exams')
          const isActive = item.label === 'Bài thi'
            ? location.pathname === item.path || isExamRoute
            : location.pathname === item.path

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 text-xs font-bold rounded-xl transition-all overflow-hidden whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200/50 font-bold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="shrink-0 flex items-center justify-center w-5 h-5">{item.icon}</span>
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
