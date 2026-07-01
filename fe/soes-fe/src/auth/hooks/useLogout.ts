import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../api/axios'
import { useAuthStore } from '../../store/authStore'

export function useLogout() {
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await apiClient.post('/auth/logout', undefined, { withCredentials: true })
    } catch {
      // Proceed with logout even if the API call fails
    } finally {
      logout()
      navigate('/login', { replace: true })
    }
  }

  return { logout: handleLogout }
}
