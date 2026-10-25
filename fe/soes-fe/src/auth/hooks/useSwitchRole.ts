import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { apiClient } from '../../api/axios'
import { useAuthStore } from '../../store/authStore'
import type { RoleSelectionRequired } from '../../types/auth.types'
interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

/**
 * Yêu cầu server tạo selection token mới cho user đang đăng nhập,
 * sau đó điều hướng đến trang chọn vai trò.
 * Chỉ dùng khi user có ≥ 2 vai trò.
 */
export function useSwitchRole() {
  const [isLoading, setIsLoading] = useState(false)
  const setPendingRoleSelection = useAuthStore((s) => s.setPendingRoleSelection)
  const navigate = useNavigate()

  async function switchRole() {
    setIsLoading(true)
    try {
      const { data } = await apiClient.post<ApiResponse<RoleSelectionRequired>>('/auth/request-role-switch')
      // Set pending — RoleRoute sẽ tự redirect sang /select-role.
      // Session hiện tại vẫn còn hiệu lực cho đến khi user chọn role và nhận token mới.
      setPendingRoleSelection(data.data)
      navigate('/select-role', { replace: true })
    } catch {
      toast.error('Không thể chuyển vai trò. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  return { switchRole, isLoading }
}
