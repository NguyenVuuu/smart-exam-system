import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import {
  getTeacherNotifications,
  markAllTeacherNotificationsRead,
  markTeacherNotificationRead,
  type TeacherNotification,
} from '../api/teacher-notifications.api'

interface TeacherNotificationsState {
  items: TeacherNotification[]
  totalCount: number
  unreadCount: number
  loading: boolean
  error: string | null
}

interface TeacherNotificationsActions {
  load: () => Promise<void>
  markRead: (notificationId: string) => Promise<void>
  markAllRead: () => Promise<void>
}

type TeacherNotificationsStore = TeacherNotificationsState & TeacherNotificationsActions

export const useTeacherNotificationsStore = create<TeacherNotificationsStore>()(
  subscribeWithSelector((set, get) => ({
    items: [],
    totalCount: 0,
    unreadCount: 0,
    loading: true,
    error: null,
    load: async () => {
      set({ loading: true, error: null })
      try {
        const page = await getTeacherNotifications(20)
        set({
          items: page.items,
          totalCount: page.pagination.totalItems,
          unreadCount: page.unreadCount,
          loading: false,
        })
      } catch {
        set({ loading: false, error: 'Không thể tải thông báo.' })
      }
    },
    markRead: async (notificationId) => {
      const notification = get().items.find((entry) => entry.id === notificationId)
      if (!notification || notification.isRead) return

      set((state) => ({
        items: state.items.map((entry) => entry.id === notificationId ? { ...entry, isRead: true } : entry),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }))
      try {
        await markTeacherNotificationRead(notificationId)
      } catch {
        await get().load()
      }
    },
    markAllRead: async () => {
      if (!get().unreadCount) return
      set((state) => ({
        items: state.items.map((entry) => ({ ...entry, isRead: true })),
        unreadCount: 0,
      }))
      try {
        await markAllTeacherNotificationsRead()
      } catch {
        await get().load()
      }
    },
  })),
)
