import type { ReactNode } from 'react'
import AdminLayout from '../pages/admin/components/AdminLayout'
import { useAuthStore } from '../store/authStore'
import type { UserPermission } from '../types/auth.types'
import RoleRoute from './RoleRoute'

export default function BackofficeRoute({ children, permission }: {
  children: ReactNode
  permission: UserPermission
}) {
  const user = useAuthStore((state) => state.user)
  return (
    <RoleRoute allowedRoles={['ADMIN', 'EDUCATION_OFFICER']}>
      {user?.permissions?.includes(permission) ? children : (
        <AdminLayout>
          <h1 className="text-lg font-semibold text-slate-900">Không có quyền truy cập</h1>
          <p className="mt-2 text-sm text-slate-600">Tài khoản của bạn không được phép mở trang này.</p>
        </AdminLayout>
      )}
    </RoleRoute>
  )
}
