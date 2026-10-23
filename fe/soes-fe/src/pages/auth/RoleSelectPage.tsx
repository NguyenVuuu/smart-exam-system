import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Shield,
  ClipboardList,
  GraduationCap,
  UserCheck,
  BookOpen,
  ArrowRight,
  LogOut,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useSelectRole } from '../../auth/hooks/useLogin'
import { ROLE_LABEL } from '../../utils/role'
import type { UserRole } from '../../types/auth.types'
import { useSystemSettingsStore } from '../../store/systemSettingsStore'

// ── Role Metadata Configuration ──────────────────────────────
interface RoleConfig {
  label: string
  subtitle: string
  description: string
  icon: React.ReactNode
  gradient: string
  borderColor: string
  badgeBg: string
  badgeText: string
  accentGlow: string
}

const ROLE_CONFIG: Record<UserRole, RoleConfig> = {
  STUDENT: {
    label: 'Sinh viên',
    subtitle: 'Cổng thông tin & Khảo thí Sinh viên',
    description: 'Tham gia các kỳ thi trực tuyến, làm bài thi, nộp code và theo dõi tiến độ học tập.',
    icon: <BookOpen className="w-7 h-7" />,
    gradient: 'from-amber-500/10 via-orange-500/5 to-transparent hover:from-amber-500/20 hover:border-amber-400',
    borderColor: 'border-orange-200/80 hover:border-orange-500',
    badgeBg: 'bg-orange-50 border-orange-200 text-orange-700',
    badgeText: 'Sinh viên',
    accentGlow: 'hover:shadow-orange-500/10',
  },
  TEACHER: {
    label: 'Giảng viên',
    subtitle: 'Không gian Học vụ & Đề thi Giảng viên',
    description: 'Soạn thảo đề thi, tạo câu hỏi AI, chấm bài, giám sát phòng thi trực tiếp và quản lý lớp học phần.',
    icon: <GraduationCap className="w-7 h-7" />,
    gradient: 'from-blue-500/10 via-indigo-500/5 to-transparent hover:from-blue-500/20 hover:border-blue-400',
    borderColor: 'border-blue-200/80 hover:border-blue-500',
    badgeBg: 'bg-blue-50 border-blue-200 text-blue-700',
    badgeText: 'Giảng viên',
    accentGlow: 'hover:shadow-blue-500/10',
  },
  DEPARTMENT_HEAD: {
    label: 'Trưởng bộ môn',
    subtitle: 'Quản lý Chuyên môn & Thẩm định Đề thi',
    description: 'Thẩm định câu hỏi dùng chung, phê duyệt đề thi kết thúc học phần và xem báo cáo chuyên môn.',
    icon: <UserCheck className="w-7 h-7" />,
    gradient: 'from-purple-500/10 via-violet-500/5 to-transparent hover:from-purple-500/20 hover:border-purple-400',
    borderColor: 'border-purple-200/80 hover:border-purple-500',
    badgeBg: 'bg-purple-50 border-purple-200 text-purple-700',
    badgeText: 'Trưởng bộ môn',
    accentGlow: 'hover:shadow-purple-500/10',
  },
  ADMIN: {
    label: 'Quản trị viên',
    subtitle: 'Quản trị Toàn diện Hệ thống',
    description: 'Quản lý tài khoản, phân quyền người dùng, cấu hình học vụ, giám sát toàn trường và hệ thống.',
    icon: <Shield className="w-7 h-7" />,
    gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent hover:from-emerald-500/20 hover:border-emerald-400',
    borderColor: 'border-emerald-200/80 hover:border-emerald-500',
    badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    badgeText: 'Quản trị viên',
    accentGlow: 'hover:shadow-emerald-500/10',
  },
  EDUCATION_OFFICER: {
    label: 'Giáo vụ',
    subtitle: 'Tổ chức Kỳ thi & Điều phối Học vụ',
    description: 'Tổ chức kỳ thi tập trung, lập lịch thi, quản lý phòng thi, sinh viên và điều phối khảo thí.',
    icon: <ClipboardList className="w-7 h-7" />,
    gradient: 'from-cyan-500/10 via-sky-500/5 to-transparent hover:from-cyan-500/20 hover:border-cyan-400',
    borderColor: 'border-cyan-200/80 hover:border-cyan-500',
    badgeBg: 'bg-cyan-50 border-cyan-200 text-cyan-700',
    badgeText: 'Giáo vụ',
    accentGlow: 'hover:shadow-cyan-500/10',
  },
}

export default function RoleSelectPage() {
  const navigate = useNavigate()
  const pendingRoleSelection = useAuthStore((s) => s.pendingRoleSelection)
  const logout = useAuthStore((s) => s.logout)
  const { selectRole, isLoading } = useSelectRole()
  const systemSettings = useSystemSettingsStore((s) => s.settings)

  useEffect(() => {
    if (!pendingRoleSelection) {
      navigate('/login', { replace: true })
    }
  }, [pendingRoleSelection, navigate])

  if (!pendingRoleSelection) return null

  const { user, availableRoles } = pendingRoleSelection

  const handleCancel = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/40 px-4 py-12 font-sans select-none">
      <div className="w-full max-w-3xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-8 sm:p-12 space-y-8">
        
        {/* Header Branding & Welcome */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            {systemSettings.logoUrl ? (
              <img
                src={systemSettings.logoUrl}
                alt="Logo"
                className="w-12 h-12 object-contain"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-md shadow-blue-500/20">
                <Sparkles className="w-6 h-6" />
              </div>
            )}
            <div className="text-left">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
                {systemSettings.organizationName || 'Cổng Khảo Thí Trực Tuyến'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {systemSettings.slogan || 'Smart Online Examination System'}
              </p>
            </div>
          </div>

          <div className="pt-2 max-w-lg mx-auto">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Chọn không gian làm việc
            </h1>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
              Chào mừng <span className="font-semibold text-slate-900">{user.fullName}</span>! Tài khoản của bạn có{' '}
              <span className="font-bold text-blue-600">{availableRoles.length} vai trò</span>. Vui lòng chọn vai trò bạn muốn đăng nhập cho phiên này:
            </p>
          </div>
        </div>

        {/* Role Selection Boxes (Grid) */}
        <div className={`grid gap-5 ${availableRoles.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
          {availableRoles.map((r) => {
            const config = ROLE_CONFIG[r.role] || {
              label: ROLE_LABEL[r.role] || r.role,
              subtitle: 'Không gian làm việc',
              description: 'Truy cập các chức năng của vai trò này.',
              icon: <Sparkles className="w-6 h-6" />,
              gradient: 'from-slate-50 to-white hover:from-slate-100',
              borderColor: 'border-slate-200 hover:border-slate-400',
              badgeBg: 'bg-slate-100 text-slate-700',
              badgeText: r.role,
              accentGlow: 'hover:shadow-slate-500/10',
            }

            return (
              <button
                key={r.role}
                type="button"
                onClick={() => selectRole(r.role)}
                disabled={isLoading}
                className={`
                  group relative flex flex-col text-left p-6 rounded-2xl border-2 transition-all duration-200
                  bg-gradient-to-br ${config.gradient} ${config.borderColor}
                  shadow-sm hover:shadow-xl ${config.accentGlow} hover:-translate-y-1
                  cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
                `}
              >
                {/* Top bar with Icon & Role Badge */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-800 group-hover:scale-105 transition-transform">
                    {config.icon}
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${config.badgeBg}`}>
                    {config.badgeText}
                  </span>
                </div>

                {/* Role Title & Subtitle */}
                <div className="flex-1 space-y-1.5">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                    {config.label}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500">
                    {config.subtitle}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed pt-1 line-clamp-3">
                    {config.description}
                  </p>
                </div>

                {/* Bottom Action Footer with Code & Arrow */}
                <div className="pt-4 mt-4 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded">
                    {r.code || r.role}
                  </span>
                  <div className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                    <span>Truy cập</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Loading Indicator or Cancel */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            {isLoading && (
              <span className="inline-flex items-center gap-1.5 text-blue-600 font-medium">
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang thiết lập phiên làm việc...
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-medium transition-colors cursor-pointer py-1 px-3 rounded-lg hover:bg-slate-100"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Quay lại đăng nhập</span>
          </button>
        </div>

      </div>
    </div>
  )
}

