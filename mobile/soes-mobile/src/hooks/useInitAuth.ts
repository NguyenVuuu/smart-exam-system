import { useEffect } from 'react'
import { apiClient } from '../api/client'
import { useAuthStore } from '../store/authStore'
import { tokenStorage } from '../auth/tokenStorage'
import type { User, ApiResponse } from '../types/auth.types'

/**
 * Chạy một lần lúc khởi động app.
 * Khôi phục access token rồi gọi /auth/me. Nếu token hết hạn,
 * interceptor sẽ thử refresh bằng cookie HttpOnly của backend.
 */
export function useInitAuth() {
  const { setAccessToken, setUser, setInitialized, logout } = useAuthStore()

  useEffect(() => {
    async function init() {
      try {
        const accessToken = await tokenStorage.getAccessToken()
        if (!accessToken) {
          await logout()
          return
        }

        await setAccessToken(accessToken)
        const meRes = await apiClient.get<ApiResponse<User>>('/auth/me')
        setUser(meRes.data.data)
      } catch {
        await logout()
      } finally {
        setInitialized(true)
      }
    }

    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
