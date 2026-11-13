import { router } from 'expo-router'
import { useState } from 'react'
import { Alert } from 'react-native'
import { apiClient } from '../api/client'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'
import type { ApiResponse, RoleSelectionRequired } from '../types/auth.types'

export function useSwitchRole() {
  const [isSwitching, setIsSwitching] = useState(false)
  const setPendingRoleSelection = useAuthStore((state) => state.setPendingRoleSelection)
  const closeSidebar = useUIStore((state) => state.setSidebarOpen)
  const switchRole = async () => {
    if (isSwitching) return
    setIsSwitching(true)
    try {
      const { data } = await apiClient.post<ApiResponse<RoleSelectionRequired>>('/auth/request-role-switch')
      setPendingRoleSelection(data.data)
      closeSidebar(false)
      router.replace('/(auth)/select-role')
    } catch { Alert.alert('Không thể chuyển vai trò', 'Vui lòng thử lại sau.') }
    finally { setIsSwitching(false) }
  }
  return { switchRole, isSwitching }
}
