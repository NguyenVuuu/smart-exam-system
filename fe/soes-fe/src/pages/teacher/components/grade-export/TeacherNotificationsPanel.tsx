import { CheckCheck, ChevronRight, Inbox } from 'lucide-react'
import type { TeacherNotification } from '../../api/teacher-notifications.api'
import { useTeacherNotificationsStore } from '../../store/teacherNotificationsStore'
import { formatTeacherNotificationTime } from '../../utils/teacher-notification.utils'

export default function TeacherNotificationsPanel({ onViewAppeals }: { onViewAppeals: () => void }) {
  const notifications = useTeacherNotificationsStore((state) => state.items)
  const totalCount = useTeacherNotificationsStore((state) => state.totalCount)
  const unreadCount = useTeacherNotificationsStore((state) => state.unreadCount)
  const loading = useTeacherNotificationsStore((state) => state.loading)
  const error = useTeacherNotificationsStore((state) => state.error)
  const load = useTeacherNotificationsStore((state) => state.load)
  const markRead = useTeacherNotificationsStore((state) => state.markRead)
  const markAllRead = useTeacherNotificationsStore((state) => state.markAllRead)

  const openNotification = (notification: TeacherNotification) => {
    void markRead(notification.id)
    onViewAppeals()
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
            <Inbox size={19} />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-950">Thông báo giảng dạy</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {totalCount} thông báo · {unreadCount} chưa đọc
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void markAllRead()}
          disabled={unreadCount === 0}
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-default disabled:opacity-45"
        >
          <CheckCheck size={15} /> Đánh dấu tất cả đã đọc
        </button>
      </div>

      {loading && <NotificationsLoading />}
      {!loading && error && <NotificationError message={error} onRetry={() => void load()} />}
      {!loading && !error && notifications.length === 0 && <NotificationsEmpty />}
      {!loading && !error && notifications.length > 0 && (
        <div className="divide-y divide-slate-100">
          {notifications.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onClick={() => openNotification(notification)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function NotificationRow({ notification, onClick }: { notification: TeacherNotification; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50 ${
        notification.isRead ? 'bg-white' : 'border-l-2 border-l-blue-600 bg-blue-50/40 pl-[18px]'
      }`}
    >
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {!notification.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />}
          <span className="truncate text-sm font-semibold text-slate-950">{notification.title}</span>
          {!notification.isRead && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-blue-700">Mới</span>
          )}
        </span>
        <span className="mt-1 block text-sm leading-6 text-slate-600">{notification.content}</span>
        <span className="mt-1.5 block text-xs text-slate-400">{formatTeacherNotificationTime(notification.createdAt)}</span>
      </span>
      <span className="mt-2 grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors group-hover:bg-white group-hover:text-blue-600">
        <ChevronRight size={17} />
      </span>
    </button>
  )
}

function NotificationsLoading() {
  return (
    <div className="space-y-1 p-5" aria-label="Đang tải thông báo">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="h-20 animate-pulse rounded-lg bg-slate-100" />
      ))}
    </div>
  )
}

function NotificationError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="px-5 py-14 text-center">
      <p className="text-sm text-rose-600">{message}</p>
      <button type="button" onClick={onRetry} className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50">
        Thử lại
      </button>
    </div>
  )
}

function NotificationsEmpty() {
  return (
    <div className="flex flex-col items-center px-5 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-lg bg-slate-100 text-slate-400"><Inbox size={22} /></span>
      <p className="mt-3 text-sm font-semibold text-slate-700">Chưa có thông báo</p>
      <p className="mt-1 text-xs text-slate-500">Thông báo phúc khảo mới sẽ xuất hiện tại đây.</p>
    </div>
  )
}
