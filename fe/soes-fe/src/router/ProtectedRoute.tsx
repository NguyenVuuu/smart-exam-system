import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import LoadingScreen from '../components/LoadingScreen'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isInitialized, isAuthenticated } = useAuthStore()

  if (!isInitialized) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return <>{children}</>
}
