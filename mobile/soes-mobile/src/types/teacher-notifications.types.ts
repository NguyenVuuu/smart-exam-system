export interface TeacherNotification {
  id: string
  title: string
  content: string
  link: string | null
  isRead: boolean
  createdAt: string
}

export interface TeacherNotificationsPage {
  items: TeacherNotification[]
  unreadCount: number
  pagination: { totalPages: number; totalItems: number }
}
