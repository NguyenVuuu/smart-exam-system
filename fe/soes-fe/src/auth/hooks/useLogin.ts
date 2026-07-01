import { useState } from 'react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../api/axios'
import { useAuthStore } from '../../store/authStore'
import { resolveRoleFromIdentifier, ROLE_HOME } from '../../utils/role'
import type { LoginRequest, LoginResponse } from '../../types/auth.types'

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const { setTokens, setUser } = useAuthStore()
  const navigate = useNavigate()

  async function login(values: LoginRequest) {
    setIsLoading(true)
    try {
      const { data } = await apiClient.post<ApiResponse<LoginResponse>>(
        '/auth/login',
        values,
        { withCredentials: true },
      )

      const { accessToken, user } = data.data

      // Backend sets refreshToken as HttpOnly cookie; we also store accessToken
      setTokens(accessToken, '')
      setUser(user)

      toast.success(`Welcome back, ${user.fullName}!`)

      const role = resolveRoleFromIdentifier(values.identifier, user)
      navigate(ROLE_HOME[role], { replace: true })
    } catch (err: unknown) {
      const message = extractErrorMessage(err)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return { login, isLoading }
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
    return data.message ?? 'Login failed. Please try again.'
  }
  return 'Login failed. Please try again.'
}
