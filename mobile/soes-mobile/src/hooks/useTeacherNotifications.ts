import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert } from 'react-native'
import { listTeacherNotifications, readAllTeacherNotifications, readTeacherNotification } from '../api/teacher-notifications.api'
import type { TeacherNotification } from '../types/teacher-notifications.types'

export function useTeacherNotifications() {
  const [items, setItems] = useState<TeacherNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const requestId = useRef(0)

  const load = useCallback(async (nextPage: number, refresh = false) => {
    const id = ++requestId.current
    if (refresh) setRefreshing(true)
    else setLoading(true)
    try {
      const result = await listTeacherNotifications(nextPage)
      if (id !== requestId.current) return
      setItems((current) => nextPage === 1 ? result.items : [...current, ...result.items])
      setUnreadCount(result.unreadCount)
      setPage(nextPage)
      setTotalPages(result.pagination.totalPages)
      setError(false)
    } catch { if (id === requestId.current) setError(true) }
    finally { if (id === requestId.current) { setLoading(false); setRefreshing(false) } }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => { void load(1) }, 0)
    return () => { clearTimeout(timer); requestId.current += 1 }
  }, [load])

  async function markRead(item: TeacherNotification) {
    if (item.isRead) return
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, isRead: true } : entry))
    setUnreadCount((count) => Math.max(0, count - 1))
    try { await readTeacherNotification(item.id) }
    catch {
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, isRead: false } : entry))
      setUnreadCount((count) => count + 1)
      Alert.alert('Chưa đánh dấu đã đọc', 'Vui lòng thử lại sau.')
    }
  }

  async function markAllRead() {
    if (busy || !unreadCount) return
    setBusy(true)
    try {
      await readAllTeacherNotifications()
      setItems((current) => current.map((entry) => ({ ...entry, isRead: true })))
      setUnreadCount(0)
    } catch { Alert.alert('Không thể cập nhật', 'Vui lòng thử lại sau.') }
    finally { setBusy(false) }
  }

  return { items, unreadCount, loading, refreshing, busy, error, markRead, markAllRead,
    retry: () => void load(1), refresh: () => void load(1, true), loadMore: () => {
      if (!loading && !error && page < totalPages) void load(page + 1)
    } }
}
