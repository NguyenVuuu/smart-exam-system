import { create } from 'zustand'
import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import type { User, RoleSelectionRequired } from '../types/auth.types'

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

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  /** true khi đã hoàn tất kiểm tra token lúc khởi động app */
  isInitialized: boolean
  /** Dữ liệu chờ chọn role (khi login trả về requireRoleSelection) */
  pendingRoleSelection: RoleSelectionRequired | null

  setUser: (user: User) => void
  setAccessToken: (token: string) => Promise<void>
  setRefreshToken: (token: string) => Promise<void>
  setInitialized: (initialized: boolean) => void
  setPendingRoleSelection: (data: RoleSelectionRequired | null) => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  pendingRoleSelection: null,

  setUser(user) {
    set({ user })
  },

  async setAccessToken(token) {
    // Update state đồng bộ ngay lập tức, lưu storage nền
    set({ isAuthenticated: true })
    tokenStorage.set('accessToken', token) // không await — tránh block navigation
  },

  async setRefreshToken(token) {
    tokenStorage.set('refreshToken', token) // không await
  },

  setInitialized(initialized) {
    set({ isInitialized: initialized })
  },

  setPendingRoleSelection(data) {
    set({ pendingRoleSelection: data })
  },

  async logout() {
    await tokenStorage.remove('accessToken')
    await tokenStorage.remove('refreshToken')
    set({
      user: null,
      isAuthenticated: false,
      isInitialized: true,
      pendingRoleSelection: null,
    })
  },
}))
