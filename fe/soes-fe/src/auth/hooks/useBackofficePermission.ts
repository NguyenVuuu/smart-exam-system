import { useAuthStore } from '../../store/authStore'
import type { UserPermission } from '../../types/auth.types'

export function useBackofficePermission(permission: UserPermission) {
  return useAuthStore((state) => state.user?.permissions?.includes(permission) ?? false)
}
