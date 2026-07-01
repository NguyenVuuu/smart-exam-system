import axios, { type InternalAxiosRequestConfig } from 'axios'
import { tokenStorage } from '../utils/token'
import { useAuthStore } from '../store/authStore'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  // Required so the browser automatically sends the HttpOnly refresh token cookie
  withCredentials: true,
})

// Attach access token from memory to every request
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Track whether a refresh is in-flight to avoid concurrent refresh calls
let isRefreshing = false
let pendingQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function processPendingQueue(error: unknown, token: string | null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token!)
  })
  pendingQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    const is401 = error.response?.status === 401
    const alreadyRetried = originalRequest._retry
    // Never attempt to refresh if the failing request IS the refresh endpoint
    const isRefreshEndpoint = originalRequest.url?.includes('/auth/refresh-token')

    if (!is401 || alreadyRetried || isRefreshEndpoint) {
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
      // Browser sends HttpOnly cookie automatically — no manual token attachment needed
      const { data } = await apiClient.post<{
        success: boolean
        data: { accessToken: string }
      }>('/auth/refresh-token')

      const newToken = data.data.accessToken
      useAuthStore.getState().setAccessToken(newToken)

      processPendingQueue(null, newToken)
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return apiClient(originalRequest)
    } catch (refreshError) {
      processPendingQueue(refreshError, null)
      useAuthStore.getState().logout()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)
