import { create } from 'zustand'
import type { User } from '../types/auth.types'
import { tokenStorage } from '../utils/token'

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean

  setUser: (user: User) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  initialize: () => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  setUser(user) {
    set({ user })
  },

  setTokens(accessToken, refreshToken) {
    tokenStorage.setAccessToken(accessToken)
    tokenStorage.setRefreshToken(refreshToken)
    set({ accessToken, isAuthenticated: true })
  },

  initialize() {
    const accessToken = tokenStorage.getAccessToken()
    if (accessToken) {
      set({ accessToken, isAuthenticated: true })
    }
  },

  logout() {
    tokenStorage.clear()
    set({ user: null, accessToken: null, isAuthenticated: false })
  },
}))
