import { ArrowRight, Bell } from 'lucide-react'
import type { StudentNotification } from '../api/student-portal.api'

function formatNotificationTime(isoString: string) {
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return ''

  const diffMinutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60))
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMinutes < 1) return 'Vừa xong'
  if (diffMinutes < 60) return `${diffMinutes} phút trước`
  if (diffHours < 24) return `${diffHours} giờ trước`
  if (diffDays < 7) return `${diffDays} ngày trước`
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
}

export default function StudentNotificationsMenu({
  notifications,
  unreadCount,
  loading,
  error,
  onMarkAllRead,
  onRetry,
  onSelect,
  onViewAll,
}: {
  notifications: StudentNotification[]
  unreadCount: number
  loading: boolean
  error: string | null
  onMarkAllRead: () => void
  onRetry: () => void
  onSelect: (notification: StudentNotification) => void
  onViewAll: () => void
}) {
  return (
    <div className="absolute right-0 top-11 z-30 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl shadow-slate-900/10 animate-in fade-in zoom-in-95 duration-150 font-sans">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 bg-gray-50/50">
        <div>
          <p className="text-sm font-semibold text-slate-950">Thông báo sinh viên</p>
          <p className="mt-0.5 text-xs text-slate-500">{unreadCount} thông báo chưa đọc</p>
        </div>
        <button
          type="button"
          onClick={onMarkAllRead}
          disabled={!unreadCount}
          className="text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700 disabled:cursor-default disabled:text-gray-400"
        >
          Đánh dấu đã đọc
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
        {loading && <p className="px-4 py-8 text-center text-sm text-gray-500">Đang tải thông báo...</p>}
        {!loading && error && (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-rose-600">{error}</p>
            <button type="button" onClick={onRetry} className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700">
              Thử lại
            </button>
          </div>
        )}
        {!loading && !error && notifications.length === 0 && (
          <div className="px-4 py-8 text-center">
            <Bell size={28} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">Chưa có thông báo mới.</p>
          </div>
        )}
        {!loading && !error && notifications.map((notification) => (
          <button
            key={notification.id}
            type="button"
            onClick={() => onSelect(notification)}
            className={`block w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
              notification.isRead ? 'bg-white' : 'bg-blue-50/50'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.isRead ? 'bg-gray-300' : 'bg-blue-600'}`} />
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-900 line-clamp-1">{notification.title}</span>
                  <span className="shrink-0 text-[11px] text-gray-400">{formatNotificationTime(notification.createdAt)}</span>
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-600 line-clamp-2">{notification.content}</span>
              </span>
            </div>
          </button>
        ))}
      </div>

      {!loading && !error && notifications.length > 0 && (
        <button
          type="button"
          onClick={onViewAll}
          className="flex w-full items-center justify-center gap-2 border-t border-gray-100 px-4 py-3 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
        >
          Xem tất cả thông báo <ArrowRight size={14} />
        </button>
      )}
    </div>
  )
}
