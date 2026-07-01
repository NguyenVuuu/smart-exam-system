import { useEffect } from 'react'
import { apiClient } from '../../api/axios'
import { useAuthStore } from '../../store/authStore'
import type { User } from '../../types/auth.types'

interface ApiResponse<T> {
  success: boolean
  data: T
}

export function useInitAuth() {
  const { setAccessToken, setUser, setInitialized, logout } = useAuthStore()

  useEffect(() => {
    async function init() {
      try {
        // Step 1: Try to get a fresh access token using the HttpOnly cookie.
        // Browser sends the cookie automatically — no manual attachment needed.
        const refreshRes = await apiClient.post<ApiResponse<{ accessToken: string }>>(
          '/auth/refresh-token',
        )
        const accessToken = refreshRes.data.data.accessToken
        setAccessToken(accessToken)

        // Step 2: Fetch the authenticated user profile
        const meRes = await apiClient.get<ApiResponse<User>>('/auth/me')
        setUser(meRes.data.data)
      } catch {
        // Refresh token is missing or expired — treat as logged out
        logout()
      } finally {
        // Always mark initialization as complete so routes can render
        setInitialized(true)
      }
    }

    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
