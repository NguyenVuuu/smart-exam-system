import { create } from 'zustand'
import type { User, RoleSelectionRequired } from '../types/auth.types'
import { tokenStorage } from '../auth/tokenStorage'

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
    set({ isAuthenticated: true })
    await tokenStorage.setAccessToken(token)
  },

  async setRefreshToken(token) {
    await tokenStorage.setRefreshToken(token)
  },

  setInitialized(initialized) {
    set({ isInitialized: initialized })
  },

  setPendingRoleSelection(data) {
    set({ pendingRoleSelection: data })
  },

  async logout() {
    await tokenStorage.clear()
    set({
      user: null,
      isAuthenticated: false,
      isInitialized: true,
      pendingRoleSelection: null,
    })
  },
}))
