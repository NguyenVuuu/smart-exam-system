import { Award, CheckCircle2, IdCard, ShieldCheck, UserCheck } from 'lucide-react'
import type { User } from '../../../../types/auth.types'
import { getTeacherInitials, getTeacherPositionLabel } from '../../utils/teacher-account.utils'

const PERMISSION_LABELS: Record<string, string> = {
  APPROVE_SHARED_QUESTION: 'Duyệt ngân hàng câu hỏi',
  APPROVE_FINAL_EXAM: 'Duyệt đề thi kết thúc học phần',
  VIEW_DEPARTMENT_EXAMS: 'Xem đề thi bộ môn',
  VIEW_DEPARTMENT_REPORTS: 'Xem báo cáo bộ môn',
}

export default function TeacherAccountSidebarCard({ user }: { user: User | null }) {
  const isDepartmentHead = user?.position === 'DEPARTMENT_HEAD'

  return (
    <aside className="rounded-2xl border border-gray-100 bg-white p-6 shadow-2xs space-y-6">
      {/* Avatar & Basic Info */}
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-2xl font-bold text-white shadow-md shadow-blue-500/20">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="h-full w-full rounded-2xl object-cover"
              />
            ) : (
              getTeacherInitials(user?.fullName)
            )}
          </div>
          <span
            className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500"
            title="Đang hoạt động"
          >
            <span className="h-2 w-2 rounded-full bg-white" />
          </span>
        </div>

        <h2 className="mt-3.5 text-base font-bold text-gray-900 leading-snug">
          {user?.fullName ?? 'Giảng viên'}
        </h2>
        <div className="mt-1 flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
              isDepartmentHead
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}
          >
            <Award size={13} />
            {getTeacherPositionLabel(user?.position)}
          </span>
        </div>
      </div>

      {/* Details list */}
      <div className="space-y-3.5 border-t border-gray-100 pt-5 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-400 flex items-center gap-1.5">
            <IdCard size={14} /> Mã giảng viên
          </span>
          <span className="font-semibold text-gray-800 font-mono">
            {user?.teacherCode ?? '-'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-400 flex items-center gap-1.5">
            <UserCheck size={14} /> Vai trò
          </span>
          <span className="font-semibold text-gray-800">
            {user?.role === 'TEACHER' ? 'Giảng viên' : user?.role ?? '-'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-400 flex items-center gap-1.5">
            <ShieldCheck size={14} /> Trạng thái
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
            <CheckCircle2 size={13} /> Đang hoạt động
          </span>
        </div>
      </div>

      {/* Permissions / Special badges if available */}
      {user?.permissions && user.permissions.length > 0 && (
        <div className="space-y-2 border-t border-gray-100 pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Phân quyền chuyên môn
          </p>
          <div className="flex flex-wrap gap-1.5">
            {user.permissions.map((perm) => (
              <span
                key={perm}
                className="rounded-lg bg-gray-50 border border-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600"
              >
                {PERMISSION_LABELS[perm] ?? perm}
              </span>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
