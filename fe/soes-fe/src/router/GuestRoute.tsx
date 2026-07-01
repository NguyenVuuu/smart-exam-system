import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { resolveRole, ROLE_HOME } from '../utils/role'
import LoadingScreen from '../components/LoadingScreen'

interface GuestRouteProps {
  children: React.ReactNode
}

export default function GuestRoute({ children }: GuestRouteProps) {
  const { isInitialized, isAuthenticated, user } = useAuthStore()

  if (!isInitialized) return <LoadingScreen />

  if (isAuthenticated && user) {
    return <Navigate to={ROLE_HOME[resolveRole(user)]} replace />
  }

  return <>{children}</>
}
