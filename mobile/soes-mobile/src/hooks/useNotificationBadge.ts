import { usePathname } from 'expo-router'
import { useEffect, useState } from 'react'
import { AppState } from 'react-native'
import { getUnreadNotificationCount } from '../api/notifications.api'
import { useAuthStore } from '../store/authStore'

export function useNotificationBadge() {
  const userId = useAuthStore((state) => state.user?.id)
  const pathname = usePathname()
  const [count, setCount] = useState(0)

  useEffect(() => {
    let active = true
    const refresh = () => {
      if (!userId) return
      void getUnreadNotificationCount()
        .then((value) => { if (active) setCount(value) })
        .catch(() => { if (active) setCount(0) })
    }
    refresh()
    const timer = setInterval(refresh, 30_000)
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') refresh() })
    return () => { active = false; clearInterval(timer); subscription.remove() }
  }, [pathname, userId])

  return count
}
