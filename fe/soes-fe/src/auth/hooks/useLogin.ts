import { useState } from 'react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../api/axios'
import { useAuthStore } from '../../store/authStore'
import { ROLE_HOME, ROLE_LABEL } from '../../utils/role'
import type {
  LoginRequest,
  LoginResponse,
  RoleSelectionRequired,
  SelectRoleRequest,
  User,
  UserRole,
} from '../../types/auth.types'

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

type LoginApiData = LoginResponse | RoleSelectionRequired

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const { setAccessToken, setUser, setPendingRoleSelection } = useAuthStore()
  const navigate = useNavigate()

  async function login(values: LoginRequest) {
    setIsLoading(true)
    try {
      const { data } = await apiClient.post<ApiResponse<LoginApiData>>('/auth/login', values)
      const payload = data.data

      if ('requireRoleSelection' in payload) {
        // Multiple roles — navigate to role-selection screen
        setPendingRoleSelection(payload)
        navigate('/select-role', { replace: true })
        return
      }

      // Single role — complete login
      finishLogin(payload.accessToken, payload.user)
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  function finishLogin(accessToken: string, user: User) {
    setAccessToken(accessToken)
    setUser(user)
    setPendingRoleSelection(null)
    toast.success(`Chào mừng, ${user.fullName}!`)
    navigate(ROLE_HOME[user.role], { replace: true })
  }

  return { login, isLoading }
}

export function useSelectRole() {
  const [isLoading, setIsLoading] = useState(false)
  const { setAccessToken, setUser, setPendingRoleSelection, pendingRoleSelection } = useAuthStore()
  const navigate = useNavigate()

  async function selectRole(role: UserRole) {
    if (!pendingRoleSelection) {
      navigate('/login', { replace: true })
      return
    }

    setIsLoading(true)
    try {
      const payload: SelectRoleRequest = {
        selectionToken: pendingRoleSelection.selectionToken,
        role,
      }
      const { data } = await apiClient.post<ApiResponse<LoginResponse>>('/auth/select-role', payload)
      const { accessToken, user } = data.data

      setAccessToken(accessToken)
      setUser(user)
      setPendingRoleSelection(null)
      toast.success(`Đã đăng nhập với vai trò: ${ROLE_LABEL[user.role]}`)
      navigate(ROLE_HOME[user.role], { replace: true })
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err))
      // Token may be expired — send back to login
      setPendingRoleSelection(null)
      navigate('/login', { replace: true })
    } finally {
      setIsLoading(false)
    }
  }

  return { selectRole, isLoading, pendingRoleSelection }
}

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
  return 'Đăng nhập thất bại. Vui lòng thử lại.'
}
