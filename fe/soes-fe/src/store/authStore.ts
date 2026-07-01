import { create } from 'zustand'
import type { User } from '../types/auth.types'
import { tokenStorage } from '../utils/token'

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isInitialized: boolean // true once the startup refresh-token check has completed

  setUser: (user: User) => void
  setAccessToken: (token: string) => void
  setInitialized: (initialized: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isInitialized: false,

  setUser(user) {
    set({ user })
  },

  setAccessToken(token) {
    tokenStorage.setAccessToken(token)
    set({ accessToken: token, isAuthenticated: true })
  },

  setInitialized(initialized) {
    set({ isInitialized: initialized })
  },

  logout() {
    tokenStorage.clearAccessToken()
    set({ user: null, accessToken: null, isAuthenticated: false, isInitialized: true })
  },
}))
