import { useState } from 'react'
import { router } from 'expo-router'
import { apiClient } from '../api/client'
import { useAuthStore } from '../store/authStore'
import { ROLE_HOME } from '../utils/role'
import type {
  LoginRequest,
  LoginResponse,
  RoleSelectionRequired,
  SelectRoleRequest,
  User,
  UserRole,
  ApiResponse,
} from '../types/auth.types'

type LoginApiData = LoginResponse | RoleSelectionRequired

// ── useLogin ────────────────────────────────────────────────────────────────

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setAccessToken, setRefreshToken, setUser, setPendingRoleSelection } = useAuthStore()

  async function login(values: LoginRequest) {
    setIsLoading(true)
    setError(null)

    try {
      const { data, headers } = await apiClient.post<ApiResponse<LoginApiData>>(
        '/auth/login',
        values,
      )
      const payload = data.data

      if ('requireRoleSelection' in payload) {
        // Multi-role: navigate sang màn chọn role
        setPendingRoleSelection(payload)
        router.replace('/(auth)/select-role')
        return
      }

      // Single role: hoàn tất đăng nhập
      // Lưu ý: BE set refreshToken qua Set-Cookie header, nhưng mobile không đọc được cookie.
      // Nếu BE hỗ trợ trả refreshToken trong body thì lưu vào đây.
      // Tạm thời lưu accessToken; refreshToken sẽ được xử lý theo thỏa thuận với BE.
      const refreshToken = headers['x-refresh-token'] as string | undefined
      if (refreshToken) await setRefreshToken(refreshToken)

      await finishLogin(payload.accessToken, payload.user)
    } catch (err: unknown) {
      setError(extractErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  async function finishLogin(accessToken: string, user: User) {
    await setAccessToken(accessToken)
    setUser(user)
    setPendingRoleSelection(null)
    router.replace(ROLE_HOME[user.role] as never)
  }

  return { login, isLoading, error, clearError: () => setError(null) }
}

// ── useSelectRole ────────────────────────────────────────────────────────────

export function useSelectRole() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setAccessToken, setRefreshToken, setUser, setPendingRoleSelection, pendingRoleSelection } =
    useAuthStore()

  async function selectRole(role: UserRole) {
    if (!pendingRoleSelection) {
      router.replace('/(auth)/login')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const payload: SelectRoleRequest = {
        selectionToken: pendingRoleSelection.selectionToken,
        role,
      }
      const { data, headers } = await apiClient.post<ApiResponse<LoginResponse>>(
        '/auth/select-role',
        payload,
      )
      const { accessToken, user } = data.data

      const refreshToken = headers['x-refresh-token'] as string | undefined
      if (refreshToken) await setRefreshToken(refreshToken)

      await setAccessToken(accessToken)
      setUser(user)
      setPendingRoleSelection(null)
      router.replace(ROLE_HOME[user.role] as never)
    } catch (err: unknown) {
      setError(extractErrorMessage(err))
      setPendingRoleSelection(null)
      router.replace('/(auth)/login')
    } finally {
      setIsLoading(false)
    }
  }

  return { selectRole, isLoading, error, pendingRoleSelection }
}

// ── helpers ──────────────────────────────────────────────────────────────────

function extractErrorMessage(err: unknown): string {
  if (
    err &&
    typeof err === 'object' &&
    'response' in err &&
    err.response &&
    typeof err.response === 'object' &&
    'data' in err.response
  ) {
    const data = err.response.data as { message?: string }
    return data.message ?? 'Đăng nhập thất bại. Vui lòng thử lại.'
  }
  return 'Không thể kết nối máy chủ. Vui lòng thử lại.'
}
