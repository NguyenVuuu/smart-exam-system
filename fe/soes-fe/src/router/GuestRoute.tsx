import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { resolveRole, ROLE_HOME } from '../utils/role'

interface GuestRouteProps {
  children: React.ReactNode
}

export default function GuestRoute({ children }: GuestRouteProps) {
  const { isAuthenticated, user } = useAuthStore()

  // Only redirect away from login if we have both a valid token AND user info
  if (isAuthenticated && user) {
    const role = resolveRole(user)
    return <Navigate to={ROLE_HOME[role]} replace />
  }

  return <>{children}</>
}
