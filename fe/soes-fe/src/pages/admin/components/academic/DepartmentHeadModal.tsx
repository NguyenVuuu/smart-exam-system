import { UserMinus, UserPlus, X } from 'lucide-react'
import type { AdminUser, Department } from '../../types/admin.types'
import AdminButton from '../AdminButton'

export default function DepartmentHeadModal({
  department,
  teacherCandidates,
  selectedHeadUserId,
  onSelect,
  onClose,
  onConfirm,
}: {
  department: Department | null
  teacherCandidates: AdminUser[]
  selectedHeadUserId: string
  onSelect: (userId: string) => void
  onClose: () => void
  onConfirm: () => void
}) {
  if (!department) return null

  const isRemoving = selectedHeadUserId === 'NONE'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Bổ nhiệm trưởng bộ môn - {department.name}
            </h2>
            <p className="mt-1 text-[13px] leading-[19px] text-slate-500">
              Chọn giảng viên làm Trưởng bộ môn. Chọn mục chưa có để gỡ bổ nhiệm hiện tại.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-gray-100 hover:text-slate-700"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-5">
          <HeadOption
            checked={selectedHeadUserId === 'NONE'}
            title="Chưa có trưởng bộ môn"
            onClick={() => onSelect('NONE')}
          />

          {teacherCandidates.map((teacher) => (
            <HeadOption
              key={teacher.id}
              checked={selectedHeadUserId === teacher.id}
              title={teacher.fullName}
              subtitle={`${teacher.code} • ${teacher.departmentName ?? 'Chưa gán bộ môn'}`}
              initials={getInitials(teacher.fullName)}
              onClick={() => onSelect(teacher.id)}
            />
          ))}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <AdminButton tone="secondary" onClick={onClose}>
            Hủy
          </AdminButton>
          <AdminButton icon={isRemoving ? <UserMinus size={17} /> : <UserPlus size={17} />} onClick={onConfirm}>
            {isRemoving ? 'Gỡ bổ nhiệm' : 'Bổ nhiệm'}
          </AdminButton>
        </div>
      </div>
    </div>
  )
}

function HeadOption({
  checked,
  title,
  subtitle,
  initials,
  onClick,
}: {
  checked: boolean
  title: string
  subtitle?: string
  initials?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition-colors ${
        checked
          ? 'border-amber-400 bg-amber-50/40'
          : 'border-gray-200 bg-white hover:border-amber-200 hover:bg-amber-50/30'
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        {initials && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-semibold text-white">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">{title}</p>
          {subtitle && <p className="mt-0.5 truncate text-xs text-slate-400">{subtitle}</p>}
        </div>
      </div>

      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
          checked ? 'border-amber-500' : 'border-slate-400'
        }`}
      >
        {checked && <span className="h-3 w-3 rounded-full bg-amber-500" />}
      </span>
    </button>
  )
}

function getInitials(fullName: string) {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}
