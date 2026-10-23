import { useEffect } from 'react'
import { getMyBackofficePermissions } from '../../pages/admin/api/admin-permissions.api'
import { useAuthStore } from '../../store/authStore'

export function useSyncBackofficePermissions() {
  const profileId = useAuthStore((state) => state.user?.profileId)
  useEffect(() => {
    let active = true
    let pending = false
    const refresh = async () => {
      if (pending) return
      pending = true
      try {
        const permissions = await getMyBackofficePermissions()
        const { user, setUser } = useAuthStore.getState()
        if (active && user && user.profileId === profileId) setUser({ ...user, permissions })
      } catch {
        // API guards remain authoritative when the permission refresh is unavailable.
      } finally {
        pending = false
      }
    }
    void refresh()
    window.addEventListener('focus', refresh)
    return () => { active = false; window.removeEventListener('focus', refresh) }
  }, [profileId])
}
