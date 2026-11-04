import { useEffect } from 'react'
import { router } from 'expo-router'
import { useAuthStore } from '../store/authStore'

/**
 * Dùng trong các màn hình protected.
 * Nếu user chưa đăng nhập sau khi app đã init xong → redirect về login.
 */
export function useRequireAuth() {
  const { isInitialized, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace('/(auth)/login')
    }
  }, [isInitialized, isAuthenticated])

  return { isInitialized, isAuthenticated }
}
