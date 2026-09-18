import TeacherTablePanel from '../TeacherTablePanel'
import { useTeacherNotificationsStore } from '../../store/teacherNotificationsStore'
import { formatTeacherNotificationTime } from '../../utils/teacher-notification.utils'

export default function TeacherNotificationsPanel({ onViewAppeals }: { onViewAppeals: () => void }) {
  const notifications = useTeacherNotificationsStore((state) => state.items)
  const loading = useTeacherNotificationsStore((state) => state.loading)
  const error = useTeacherNotificationsStore((state) => state.error)
  const load = useTeacherNotificationsStore((state) => state.load)
  const markRead = useTeacherNotificationsStore((state) => state.markRead)

  const openAppeals = (notificationId: string) => {
    void markRead(notificationId)
    onViewAppeals()
  }

  return (
    <TeacherTablePanel>
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-950">Thông báo</h3>
        <p className="mt-1 text-xs text-slate-500">Lịch sử thông báo được đồng bộ với chuông trên thanh điều hướng.</p>
      </div>
      <div className="divide-y divide-slate-100">
        {loading && <div className="px-5 py-8 text-center text-sm text-slate-400">Đang tải thông báo...</div>}
        {!loading && error && (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-rose-600">{error}</p>
            <button type="button" onClick={() => void load()} className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700">
              Thử lại
            </button>
          </div>
        )}
        {!loading && !error && notifications.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-slate-400">Chưa có thông báo.</div>
        )}
        {!loading && !error && notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between ${
              notification.isRead ? 'bg-white' : 'bg-blue-50/50'
            }`}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-slate-900">{notification.title}</span>
                {!notification.isRead && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">Mới</span>
                )}
                <span className="text-[11px] text-slate-400">{formatTeacherNotificationTime(notification.createdAt)}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{notification.content}</p>
            </div>
            <button
              type="button"
              onClick={() => openAppeals(notification.id)}
              className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-[11px] font-bold text-white hover:bg-blue-700"
            >
              Xem phúc khảo
            </button>
          </div>
        ))}
      </div>
    </TeacherTablePanel>
  )
}
