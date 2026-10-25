import { Crown, Edit, KeyRound, Lock, Unlock } from 'lucide-react'
import AppBadge from '../../../../components/common/AppBadge'
import { useBackofficePermission } from '../../../../auth/hooks/useBackofficePermission'
import DataTable, { type ColumnDef } from '../../../../components/common/DataTable'
import { useAuthStore } from '../../../../store/authStore'
import type { AdminUser } from '../../types/admin.types'

const roleLabel: Record<AdminUser['role'], string> = {
  ADMIN: 'Quản trị viên',
  EDUCATION_OFFICER: 'Giáo vụ',
  TEACHER: 'Giảng viên',
  STUDENT: 'Sinh viên',
}

export default function UsersTable({
  users,
  onToggleDepartmentHead,
  onResetPassword,
  onEditUser,
  onToggleLock,
}: {
  users: AdminUser[]
  onToggleDepartmentHead: (user: AdminUser) => void
  onResetPassword: (user: AdminUser) => void
  onEditUser: (user: AdminUser) => void
  onToggleLock: (user: AdminUser) => void
}) {
  const isAdmin = useAuthStore((state) => state.user?.role === 'ADMIN')
  const canManage = useBackofficePermission('USERS_MANAGE')
  const canAssignHead = useBackofficePermission('ACADEMIC_MANAGE')
  const columns: ColumnDef<AdminUser>[] = [
    {
      header: 'NGƯỜI DÙNG',
      render: (item) => (
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-950">{item.fullName}</p>
            {item.position === 'DEPARTMENT_HEAD' && <Crown size={14} className="text-amber-500" />}
          </div>
          <p className="text-xs text-slate-400">{item.code}</p>
        </div>
      ),
    },
    {
      header: 'EMAIL',
      width: '250px',
      render: (item) => <span className="text-sm text-slate-700">{item.email}</span>,
    },
    {
      header: 'VAI TRÒ',
      width: '150px',
      render: (item) => (
        <AppBadge tone={item.role === 'ADMIN' ? 'rose' : item.role === 'TEACHER' ? 'emerald' : 'blue'}>
          {roleLabel[item.role]}
        </AppBadge>
      ),
    },
    {
      header: 'BỘ MÔN',
      width: '260px',
      render: (item) => <span className="text-sm text-slate-600">{item.departmentName ?? '—'}</span>,
    },
    {
      header: 'TRẠNG THÁI',
      width: '150px',
      render: (item) => (
        <AppBadge tone={item.status === 'ACTIVE' ? 'emerald' : 'rose'}>
          {item.status === 'ACTIVE' ? 'Hoạt động' : 'Bị khóa'}
        </AppBadge>
      ),
    },
    {
      header: 'THAO TÁC',
      width: '160px',
      align: 'right',
      render: (item) => (
        <div className="flex justify-end gap-1 text-slate-500">
          {canAssignHead && item.role === 'TEACHER' && (
            <button
              className="rounded-lg p-1.5 hover:bg-amber-50 hover:text-amber-600"
              title="Bổ nhiệm/gỡ Trưởng bộ môn"
              onClick={() => onToggleDepartmentHead(item)}
            >
              <Crown size={17} />
            </button>
          )}
          {canManage && (item.role !== 'ADMIN' || isAdmin) && <><button
            className="rounded-lg p-1.5 hover:bg-blue-50 hover:text-blue-600"
            title="Reset mật khẩu"
            onClick={() => onResetPassword(item)}
          >
            <KeyRound size={17} />
          </button>
          <button
            className="rounded-lg p-1.5 hover:bg-blue-50 hover:text-blue-600"
            title="Chỉnh sửa"
            onClick={() => onEditUser(item)}
          >
            <Edit size={17} />
          </button>
          <button
            className="rounded-lg p-1.5 hover:bg-rose-50 hover:text-rose-600"
            title={item.status === 'LOCKED' ? 'Mở khóa' : 'Khóa tài khoản'}
            onClick={() => onToggleLock(item)}
          >
            {item.status === 'LOCKED' ? <Unlock size={17} /> : <Lock size={17} />}
          </button>
          </>}
        </div>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={users}
      keyExtractor={(item) => item.id}
      emptyText="Chưa có tài khoản phù hợp."
    />
  )
}
