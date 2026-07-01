import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { resolveRole, ROLE_HOME } from '../utils/role'
import LoadingScreen from '../components/LoadingScreen'
import type { UserRole } from '../types/auth.types'

interface RoleRouteProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
}

export default function RoleRoute({ children, allowedRoles }: RoleRouteProps) {
  const { isInitialized, isAuthenticated, user } = useAuthStore()

  if (!isInitialized) return <LoadingScreen />
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />

  const role = resolveRole(user)
  if (!allowedRoles.includes(role)) return <Navigate to={ROLE_HOME[role]} replace />

  return <>{children}</>
}
