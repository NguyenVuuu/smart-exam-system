import { Bell, ChevronDown, ShieldCheck, UserCheck } from 'lucide-react'
import { useState } from 'react'
import { useLogout } from '../../../auth/hooks/useLogout'
import { useAuthStore } from '../../../store/authStore'

export default function AdminTopBar() {
  const user = useAuthStore((s) => s.user)
  const { logout } = useLogout()
  const [openUserMenu, setOpenUserMenu] = useState(false)

  return (
    <header className="h-16 bg-white border-b border-gray-100 px-8 flex items-center justify-between shrink-0 font-sans">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <ShieldCheck size={16} className="text-rose-600" />
        <span className="font-semibold text-gray-900">Ban Khảo Thí & Đảm Bảo Chất Lượng Đào Tạo</span>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors relative">
          <Bell size={18} />
          <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2 ring-2 ring-white" />
        </button>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpenUserMenu((p) => !p)}
            className="flex items-center gap-3 pl-4 border-l border-gray-100 text-left hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
              AD
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">{user?.fullName || 'Ban Khảo Thí (Admin)'}</p>
              <p className="text-[10px] text-gray-400">Trưởng ban Khảo thí</p>
            </div>
            <ChevronDown size={14} className="text-gray-400 ml-1" />
          </button>

          {openUserMenu && (
            <div className="absolute right-0 top-11 w-52 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1.5 divide-y divide-gray-100 font-sans">
              <div className="px-4 py-2 text-xs">
                <p className="font-bold text-gray-900">{user?.fullName ?? 'Ban Khảo Thí'}</p>
                <p className="text-[10px] text-rose-600 font-semibold">Quyền: Quản trị / Khảo thí</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setOpenUserMenu(false)
                    useAuthStore.getState().setUser({
                      id: 'usr-teacher-01',
                      profileId: 'prof-teacher-01',
                      email: 'teacher@soes.edu.vn',
                      fullName: 'TS. Nguyễn Văn Giảng (Giảng Viên)',
                      avatarUrl: null,
                      role: 'TEACHER',
                      studentCode: null,
                      teacherCode: 'GV000001',
                      adminCode: null,
                    })
                    window.location.href = '/teacher'
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors flex items-center gap-2"
                >
                  <UserCheck size={14} />
                  <span>Chuyển sang Giảng Viên</span>
                </button>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setOpenUserMenu(false)
                    logout()
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  Đăng xuất Quản trị
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
