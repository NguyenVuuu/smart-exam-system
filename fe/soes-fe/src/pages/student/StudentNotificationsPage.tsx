import { Bell, CheckCircle2, RefreshCw } from 'lucide-react'
import { useStudentDashboard } from './hooks/useStudentDashboard'
import StudentSidebar from './components/StudentSidebar'
import StudentTopBar from './components/StudentTopBar'

const DOT_TONE = {
  green: 'bg-emerald-500',
  yellow: 'bg-amber-400',
  red: 'bg-rose-500',
} as const

export default function StudentNotificationsPage() {
  const { isLoading, error, notifications } = useStudentDashboard()
  const unreadCount = notifications.filter((item) => item.dot !== 'yellow').length

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">
      <StudentSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <StudentTopBar />
        <main className="min-w-0 flex-1 space-y-5 overflow-y-auto px-6 py-7 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Bell size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-950">Thông báo</h1>
              <p className="mt-0.5 text-sm text-slate-500">Các cập nhật quan trọng từ lớp học phần và hệ thống thi.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Metric label="Tổng thông báo" value={notifications.length} tone="text-blue-600" />
            <Metric label="Cần chú ý" value={unreadCount} tone="text-emerald-600" />
          </div>

          <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-bold text-slate-900">Danh sách thông báo</h2>
              {isLoading && (
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <RefreshCw size={14} className="animate-spin" /> Đang tải
                </span>
              )}
            </div>

            {isLoading && <Message text="Đang tải thông báo..." />}
            {!isLoading && error && <Message text={error} />}
            {!isLoading && !error && notifications.length === 0 && <Message text="Bạn chưa có thông báo nào." />}
            {!isLoading && !error && notifications.length > 0 && (
              <div className="divide-y divide-gray-100">
                {notifications.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50/70">
                    <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${DOT_TONE[item.dot]}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">{item.message}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.dot === 'yellow' ? 'Đã đọc' : 'Thông báo mới'}
                      </p>
                    </div>
                    {item.dot === 'yellow' && <CheckCircle2 size={17} className="shrink-0 text-slate-300" />}
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}

function Metric({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  )
}

function Message({ text }: { text: string }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center gap-3 px-6 py-10 text-center text-sm text-slate-500">
      <Bell size={34} className="text-slate-300" />
      <span>{text}</span>
    </div>
  )
}
