import {
  BarChart2,
  Bell,
  BookOpen,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Settings,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

interface NavItem {
  label: string
  icon: React.ReactNode
  path: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/student' },
  { label: 'Môn học',   icon: <BookOpen size={18} />,        path: '/student/subjects' },
  { label: 'Bài thi',  icon: <ClipboardList size={18} />,    path: '/student/exams' },
  { label: 'Kết quả',  icon: <BarChart2 size={18} />,        path: '/student/results' },
  { label: 'Tài liệu', icon: <FileText size={18} />,         path: '/student/materials' },
  { label: 'Thông báo',icon: <Bell size={18} />,             path: '/student/notifications' },
  { label: 'Cài đặt',  icon: <Settings size={18} />,         path: '/student/settings' },
]

export default function StudentSidebar() {
  const navigate  = useNavigate()
  const location  = useLocation()

  return (
    <aside className="w-48 shrink-0 bg-white border-r border-gray-100 flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-gray-100">
        <span className="text-lg font-bold text-gray-900 tracking-tight">SOES</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
