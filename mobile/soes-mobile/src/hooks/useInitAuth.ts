import { useEffect } from 'react'
import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { apiClient } from '../api/client'
import { useAuthStore } from '../store/authStore'
import type { User, ApiResponse } from '../types/auth.types'

// Web fallback: SecureStore không hỗ trợ web
const tokenStorage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key)
    }
    return SecureStore.getItemAsync(key)
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value)
      return
    }
    await SecureStore.setItemAsync(key, value)
  },
  async remove(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key)
      return
    }
    await SecureStore.deleteItemAsync(key)
  },
}

export { tokenStorage }

/**
 * Chạy một lần lúc khởi động app.
 * Thử dùng refreshToken để lấy accessToken mới,
 * sau đó fetch /auth/me để lấy thông tin user.
 */
export function useInitAuth() {
  const { setAccessToken, setUser, setInitialized, logout } = useAuthStore()

  useEffect(() => {
    async function init() {
      try {
        const refreshToken = await tokenStorage.get('refreshToken')
        if (!refreshToken) {
          await logout()
          return
        }

        const refreshRes = await apiClient.post<ApiResponse<{ accessToken: string }>>(
          '/auth/refresh-token',
          { refreshToken },
        )
        const accessToken = refreshRes.data.data.accessToken
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
