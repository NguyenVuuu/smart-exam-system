import { useCallback, useEffect, useState } from 'react'
import { getSocket } from '../../../api/socket'
import type { TeacherNotification } from '../../teacher/api/teacher-notifications.api'
import { getAdminNotifications, markAdminNotificationRead, markAllAdminNotificationsRead } from '../api/admin-notifications.api'

export function useAdminNotifications(userId?: string) {
  const [items, setItems] = useState<TeacherNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!userId) return
    try {
      const page = await getAdminNotifications()
      setItems(page.items)
      setUnreadCount(page.unreadCount)
      setError(null)
    } catch {
      setError('Không thể tải thông báo.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    const socket = getSocket()
    const onNewNotification = () => { void load() }
    socket.on('notification:created', onNewNotification)
    socket.on('connect', onNewNotification)
    return () => {
      window.clearTimeout(timer)
      socket.off('notification:created', onNewNotification)
      socket.off('connect', onNewNotification)
    }
  }, [load])

  async function markRead(id: string) {
    try {
      await markAdminNotificationRead(id)
      await load()
    } catch { setError('Không thể đánh dấu đã đọc.') }
  }

  async function markAllRead() {
    try {
      await markAllAdminNotificationsRead()
      await load()
    } catch { setError('Không thể đánh dấu đã đọc.') }
  }

  return { items, unreadCount, loading, error, load, markRead, markAllRead }
}
