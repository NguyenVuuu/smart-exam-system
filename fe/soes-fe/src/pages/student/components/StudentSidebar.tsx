import {
  BarChart2,
  Bell,
  BookOpen,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Settings,
} from 'lucide-react'

interface NavItem {
  label: string
  icon: React.ReactNode
  active?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={18} />, active: true },
  { label: 'Môn học', icon: <BookOpen size={18} /> },
  { label: 'Bài thi', icon: <ClipboardList size={18} /> },
  { label: 'Kết quả', icon: <BarChart2 size={18} /> },
  { label: 'Tài liệu', icon: <FileText size={18} /> },
  { label: 'Thông báo', icon: <Bell size={18} /> },
  { label: 'Cài đặt', icon: <Settings size={18} /> },
]

export default function StudentSidebar() {
  return (
    <aside className="w-48 shrink-0 bg-white border-r border-gray-100 flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-gray-100">
        <span className="text-lg font-bold text-gray-900 tracking-tight">SOES</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.label}
            className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
              item.active
                ? 'bg-blue-50 text-blue-600 font-medium'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
