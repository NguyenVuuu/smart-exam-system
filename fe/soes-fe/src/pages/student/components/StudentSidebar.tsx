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
import { useSystemSettingsStore } from '../../../store/systemSettingsStore'

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
  const systemSettings = useSystemSettingsStore((state) => state.settings)
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
      {/* Logo Header */}
      <div className={`h-16 flex items-center border-b border-gray-100 shrink-0 overflow-hidden whitespace-nowrap ${
        isCollapsed ? 'justify-center px-0' : 'px-3.5'
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
            <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap animate-in fade-in duration-200">
              <span className="text-xl font-bold text-gray-900 tracking-tight truncate max-w-[100px]" title={systemSettings.organizationName}>
                {systemSettings.shortName || 'SOES'}
              </span>
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
