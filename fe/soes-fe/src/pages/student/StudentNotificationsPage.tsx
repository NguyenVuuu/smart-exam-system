import { Bell, CheckCircle2, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSocket } from '../../api/socket'
import {
  getStudentNotifications,
  markAllStudentNotificationsRead,
  markStudentNotificationRead,
  type StudentNotification,
} from './api/student-portal.api'
import StudentSidebar from './components/StudentSidebar'
import StudentTopBar from './components/StudentTopBar'

export default function StudentNotificationsPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<StudentNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getStudentNotifications({ page: 1, pageSize: 50 })
      setNotifications(data.items)
    } catch {
      setError('Không thể tải thông báo.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load() }, [load])
  useEffect(() => {
    const socket = getSocket()
    const handleNotificationCreated = (notification: StudentNotification) => {
      setNotifications((current) => (
        current.some((item) => item.id === notification.id)
          ? current
          : [notification, ...current].slice(0, 50)
      ))
    }

    socket.on('notification:created', handleNotificationCreated)
    return () => {
      socket.off('notification:created', handleNotificationCreated)
    }
  }, [])

  const unreadCount = useMemo(() => notifications.filter((item) => !item.isRead).length, [notifications])

  const markRead = async (item: StudentNotification) => {
    if (item.isRead) return
    setNotifications((current) => current.map((entry) => (
      entry.id === item.id ? { ...entry, isRead: true } : entry
    )))
    try {
      await markStudentNotificationRead(item.id)
      window.dispatchEvent(new Event('student-notifications:changed'))
    } catch {
      setNotifications((current) => current.map((entry) => (
        entry.id === item.id ? { ...entry, isRead: false } : entry
      )))
    }
  }

  const handleNotificationClick = async (item: StudentNotification) => {
    const target = resolveNotificationLink(item)
    if (target) navigate(target)
    await markRead(item)
  }

  const markAllRead = async () => {
    const previous = notifications
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true })))
    try {
      await markAllStudentNotificationsRead()
      window.dispatchEvent(new Event('student-notifications:changed'))
    } catch {
      setNotifications(previous)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">
      <StudentSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <StudentTopBar />
        <main className="min-w-0 flex-1 space-y-5 overflow-y-auto px-6 py-7 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Bell size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-950">Thông báo</h1>
                <p className="mt-0.5 text-sm text-slate-500">Các cập nhật quan trọng từ lớp học phần và hệ thống thi.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={markAllRead}
                disabled={isLoading || unreadCount === 0}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <CheckCircle2 size={15} /> Đánh dấu đã đọc
              </button>
              <button
                type="button"
                onClick={() => void load()}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw size={15} /> Làm mới
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Metric label="Tổng thông báo" value={notifications.length} tone="text-blue-600" />
            <Metric label="Chưa đọc" value={unreadCount} tone="text-emerald-600" />
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
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => void handleNotificationClick(item)}
                    className="flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-gray-50/70"
                  >
                    <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${item.isRead ? 'bg-slate-300' : 'bg-blue-500'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{item.content}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDateTime(item.createdAt)}</p>
                    </div>
                    {item.isRead && <CheckCircle2 size={17} className="shrink-0 text-slate-300" />}
                  </button>
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

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function resolveNotificationLink(item: StudentNotification) {
  if (item.link) return item.link
  const text = `${item.title} ${item.content}`.toLocaleLowerCase('vi')
  if (text.includes('điểm')) return '/student/scores'
  if (text.includes('ca thi') || text.includes('bài thi')) return '/student/exams'
  return null
}
