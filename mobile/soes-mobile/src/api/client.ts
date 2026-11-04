import axios, { type InternalAxiosRequestConfig } from 'axios'
import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

// Web fallback cho SecureStore
const tokenStorage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return localStorage.getItem(key)
    return SecureStore.getItemAsync(key)
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') { localStorage.setItem(key, value); return }
    await SecureStore.setItemAsync(key, value)
  },
  async remove(key: string): Promise<void> {
    if (Platform.OS === 'web') { localStorage.removeItem(key); return }
    await SecureStore.deleteItemAsync(key)
  },
}

// IP LAN máy tính — dùng cho Expo Go trên điện thoại thật
// Thay đổi nếu IP máy tính thay đổi
const LAN_IP = '192.168.1.7'

export const API_BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost:3000/api'          // browser
    : `http://${LAN_IP}:3000/api`          // Expo Go (Android/iOS device)

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// ── Request interceptor: đính access token ──────────────────────────────────
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const isAuthEndpoint =
    config.url?.includes('/auth/login') ||
    config.url?.includes('/auth/refresh-token') ||
    config.url?.includes('/auth/select-role')

  if (!isAuthEndpoint) {
    const token = await tokenStorage.get('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }

  return config
})

// ── Response interceptor: auto refresh khi 401 ──────────────────────────────
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
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    const is401 = error.response?.status === 401
    const alreadyRetried = originalRequest._retry
    const isRefreshEndpoint = originalRequest.url?.includes('/auth/refresh-token')
    const isLoginEndpoint = originalRequest.url?.includes('/auth/login')

    if (!is401 || alreadyRetried || isRefreshEndpoint || isLoginEndpoint) {
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
      const refreshToken = await tokenStorage.get('refreshToken')
      if (!refreshToken) throw new Error('No refresh token')

      const { data } = await apiClient.post<{
        success: boolean
        data: { accessToken: string }
      }>('/auth/refresh-token', { refreshToken })

      const newToken = data.data.accessToken
      await tokenStorage.set('accessToken', newToken)

      processPendingQueue(null, newToken)
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return apiClient(originalRequest)
    } catch (refreshError) {
      processPendingQueue(refreshError, null)
      await tokenStorage.remove('accessToken')
      await tokenStorage.remove('refreshToken')
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)
