import { useState } from 'react'
import { router } from 'expo-router'
import { apiClient } from '../api/client'
import { useAuthStore } from '../store/authStore'

export function useLogout() {
  const [isLoading, setIsLoading] = useState(false)
  const logout = useAuthStore((s) => s.logout)

  async function handleLogout() {
    setIsLoading(true)
    try {
      // Gọi BE để xóa refreshToken trong Redis + blacklist accessToken
      await apiClient.post('/auth/logout')
    } catch {
      // Bỏ qua lỗi network — vẫn logout local
    } finally {
      await logout()
      setIsLoading(false)
      router.replace('/(auth)/login')
    }
  }

  return { handleLogout, isLoading }
}
