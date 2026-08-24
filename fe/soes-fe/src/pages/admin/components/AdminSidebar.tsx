import {
  BookOpen,
  Database,
  FileCheck,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Users,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLogout } from '../../../auth/hooks/useLogout'

interface NavItem {
  label: string
  icon: React.ReactNode
  path: string
  badgeCount?: number
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'TỔNG QUAN',
    items: [
      { label: 'Bảng điều khiển', icon: <LayoutDashboard size={18} />, path: '/admin' },
    ],
  },
  {
    title: 'THẨM ĐỊNH & KHẢO THÍ',
    items: [
      {
        label: 'Duyệt đề thi Cuối kỳ',
        icon: <FileCheck size={18} />,
        path: '/admin/exam-approvals',
        badgeCount: 2,
      },
      {
        label: 'Duyệt Ngân hàng chung',
        icon: <Database size={18} />,
        path: '/admin/question-approvals',
        badgeCount: 3,
      },
    ],
  },
  {
    title: 'QUẢN LÝ HỌC VỤ',
    items: [
      { label: 'Học kỳ & Môn học', icon: <BookOpen size={18} />, path: '/admin/academic' },
      { label: 'Lớp học phần & Xếp lớp', icon: <GraduationCap size={18} />, path: '/admin/courses' },
      { label: 'Người dùng & Tài khoản', icon: <Users size={18} />, path: '/admin/users' },
    ],
  },
]

export default function AdminSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useLogout()

  const isActive = (path: string) => location.pathname === path

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-gray-100 flex flex-col font-sans h-screen">
      {/* Logo Header */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100 gap-3 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white flex items-center justify-center font-black text-sm shadow-md">
          SO
        </div>
        <div>
          <span className="font-bold text-sm text-gray-900 tracking-tight block">SOES Khảo Thí</span>
          <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider block">Admin & Academic</span>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {NAV_GROUPS.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1.5">
            <span className="px-3 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
              {group.title}
            </span>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.path)
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      active
                        ? 'bg-rose-50 text-rose-700 font-bold'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={active ? 'text-rose-600' : 'text-gray-400'}>{item.icon}</span>
                      <span>{item.label}</span>
                    </div>

                    {item.badgeCount !== undefined && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-700">
                        {item.badgeCount}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-gray-100 shrink-0">
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
        >
          <LogOut size={16} />
          <span>Đăng xuất Quản trị</span>
        </button>
      </div>
    </aside>
  )
}
