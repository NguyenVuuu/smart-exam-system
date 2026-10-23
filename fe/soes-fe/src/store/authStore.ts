import { create } from 'zustand'
import type { AvailableRole, RoleSelectionRequired, User } from '../types/auth.types'
import { tokenStorage } from '../utils/token'

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  /** true once the startup refresh-token check has completed */
  isInitialized: boolean

  /** Pending role-selection data — set when API returns requireRoleSelection */
  pendingRoleSelection: RoleSelectionRequired | null

  setUser: (user: User) => void
  setAccessToken: (token: string) => void
  setInitialized: (initialized: boolean) => void
  setPendingRoleSelection: (data: RoleSelectionRequired | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isInitialized: false,
  pendingRoleSelection: null,

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

  setPendingRoleSelection(data) {
    set({ pendingRoleSelection: data })
  },

  logout() {
    tokenStorage.clearAccessToken()
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isInitialized: true,
      pendingRoleSelection: null,
    })
  },
}))

/** Derived selector — available roles during pending selection */
export const selectAvailableRoles = (state: AuthState): AvailableRole[] =>
  state.pendingRoleSelection?.availableRoles ?? []
