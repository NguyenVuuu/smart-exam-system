import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios'
import { tokenStorage } from '../auth/tokenStorage'

const configuredApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim()

export const API_BASE_URL = (configuredApiBaseUrl || 'http://localhost:3000/api').replace(/\/$/, '')

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
  withCredentials: true,
})

// ── Request interceptor: đính access token ──────────────────────────────────
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const isAuthEndpoint =
    config.url?.includes('/auth/login') ||
    config.url?.includes('/auth/refresh-token') ||
    config.url?.includes('/auth/select-role')

  if (!isAuthEndpoint) {
    const token = await tokenStorage.getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }

  return config
})

// ── Response interceptor: auto refresh khi 401 ──────────────────────────────
let isRefreshing = false
interface PendingRequest {
  resolve: (token: string) => void
  reject: (error: unknown) => void
}

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

let pendingQueue: PendingRequest[] = []

function rejectPendingRequests(error: unknown) {
  pendingQueue.forEach(({ reject }) => reject(error))
  pendingQueue = []
}

function resolvePendingRequests(token: string) {
  pendingQueue.forEach(({ resolve, reject }) => {
    try {
      resolve(token)
    } catch (error) {
      reject(error)
    }
  })
  pendingQueue = []
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = await tokenStorage.getRefreshToken()
  const response = await axios.post<{
    success: boolean
    data: { accessToken: string }
  }>(
    `${API_BASE_URL}/auth/refresh-token`,
    refreshToken ? { refreshToken } : {},
    { timeout: 10000, withCredentials: true },
  )

  return response.data.data.accessToken
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined

    const is401 = error.response?.status === 401
    const alreadyRetried = originalRequest?._retry
    const isRefreshEndpoint = originalRequest?.url?.includes('/auth/refresh-token')
    const isLoginEndpoint = originalRequest?.url?.includes('/auth/login')

    if (!originalRequest || !is401 || alreadyRetried || isRefreshEndpoint || isLoginEndpoint) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(apiClient(originalRequest))
          },
          reject,
        })
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const newToken = await refreshAccessToken()
      await tokenStorage.setAccessToken(newToken)

      resolvePendingRequests(newToken)
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return apiClient(originalRequest)
    } catch (refreshError) {
      rejectPendingRequests(refreshError)
      await tokenStorage.clear()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)
