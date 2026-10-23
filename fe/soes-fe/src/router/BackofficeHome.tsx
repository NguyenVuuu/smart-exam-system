import { Navigate } from 'react-router-dom'
import AdminDashboard from '../pages/admin/AdminDashboard'
import { useAuthStore } from '../store/authStore'
import AdminLayout from '../pages/admin/components/AdminLayout'
import type { UserPermission } from '../types/auth.types'

const destinations: Array<[UserPermission, string]> = [
  ['SCHEDULES_VIEW', '/admin/exam-schedules'],
  ['ACADEMIC_VIEW', '/admin/academic'],
  ['USERS_VIEW', '/admin/users'],
  ['QUESTION_BANK_VIEW', '/admin/shared-question-bank'],
  ['EXAMS_VIEW', '/admin/exams'],
  ['MONITORING_VIEW', '/admin/proctoring'],
  ['REPORTS_VIEW', '/admin/reports'],
  ['AUDIT_VIEW', '/admin/audit-logs'],
  ['SETTINGS_VIEW', '/admin/settings'],
]

export default function BackofficeHome() {
  const user = useAuthStore((state) => state.user)
  if (user?.role === 'EDUCATION_OFFICER') {
    const destination = destinations.find(([permission]) => user.permissions?.includes(permission))
    return destination ? <Navigate to={destination[1]} replace /> : (
      <AdminLayout><p>Tài khoản chưa được cấp quyền truy cập chức năng.</p></AdminLayout>
    )
  }
  return <AdminDashboard />
}
