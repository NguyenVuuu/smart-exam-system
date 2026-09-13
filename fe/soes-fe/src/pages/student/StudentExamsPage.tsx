import { AlertCircle, CalendarClock, CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, Clock, Eye, Play, RefreshCw, Search, Timer, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getStudentExamSchedules,
  type StudentExamSchedule,
  type StudentExamStatusCounts,
} from './api/student-portal.api'
import StudentSidebar from './components/StudentSidebar'
import StudentTopBar from './components/StudentTopBar'
import type { Pagination } from './types/course-detail.types'

type ExamFilter = 'ALL' | 'OPEN' | 'UPCOMING' | 'COMPLETED' | 'EXPIRED'
type StudentExamListItem = StudentExamSchedule

const PAGE_SIZE = 10

const FILTERS: Array<{ value: ExamFilter; label: string }> = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'OPEN', label: 'Đang mở' },
  { value: 'UPCOMING', label: 'Sắp diễn ra' },
  { value: 'COMPLETED', label: 'Đã hoàn thành' },
  { value: 'EXPIRED', label: 'Đã quá hạn' },
]

const EMPTY_COUNTS: StudentExamStatusCounts = {
  OPEN: 0,
  UPCOMING: 0,
  COMPLETED: 0,
  EXPIRED: 0,
}

const statusMeta: Record<Exclude<ExamFilter, 'ALL'>, { label: string; tone: string; icon: React.ReactNode }> = {
  OPEN: { label: 'Đang mở', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-100', icon: <Timer size={14} /> },
  UPCOMING: { label: 'Sắp diễn ra', tone: 'bg-blue-50 text-blue-700 ring-blue-100', icon: <CalendarClock size={14} /> },
  COMPLETED: { label: 'Đã hoàn thành', tone: 'bg-slate-100 text-slate-600 ring-slate-200', icon: <CheckCircle2 size={14} /> },
  EXPIRED: { label: 'Đã quá hạn', tone: 'bg-rose-50 text-rose-700 ring-rose-100', icon: <AlertCircle size={14} /> },
}

export default function StudentExamsPage() {
  const navigate = useNavigate()
  const [exams, setExams] = useState<StudentExamListItem[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: PAGE_SIZE, totalItems: 0, totalPages: 1 })
  const [statusCounts, setStatusCounts] = useState<StudentExamStatusCounts>(EMPTY_COUNTS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [filter, setFilter] = useState<ExamFilter>('ALL')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAppliedKeyword(keyword.trim())
      setPage(1)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [keyword])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getStudentExamSchedules({
        page,
        pageSize: PAGE_SIZE,
        status: filter,
        keyword: appliedKeyword || undefined,
      })
      setExams(data.items)
      setPagination(data.pagination)
      setStatusCounts(data.statusCounts)
    } catch {
      setError('Không thể tải danh sách bài thi.')
    } finally {
      setLoading(false)
    }
  }, [appliedKeyword, filter, page])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load() }, [load])

  const stats = useMemo(() => ({
    OPEN: statusCounts.OPEN,
    UPCOMING: statusCounts.UPCOMING,
    COMPLETED: statusCounts.COMPLETED,
    EXPIRED: statusCounts.EXPIRED,
  }), [statusCounts])

  const handleFilterChange = (value: ExamFilter) => {
    setFilter(value)
    setPage(1)
  }

  const openExam = (exam: StudentExamListItem) => {
    if (exam.status === 'COMPLETED') {
      navigate(`/student/course-offerings/${exam.courseOfferingId}/exam-schedules/${exam.id}/result`, {
        state: { attemptId: exam.attemptId },
      })
      return
    }
    navigate(`/student/course-offerings/${exam.courseOfferingId}/exam-schedules/${exam.id}`)
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
                <ClipboardList size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-950">Bài thi</h1>
                <p className="mt-0.5 text-sm text-slate-500">Theo dõi bài thi từ tất cả lớp học phần của bạn.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw size={15} /> Làm mới
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Đang mở" value={stats.OPEN} tone="text-emerald-600" />
            <Metric label="Sắp diễn ra" value={stats.UPCOMING} tone="text-blue-600" />
            <Metric label="Đã hoàn thành" value={stats.COMPLETED} tone="text-slate-600" />
            <Metric label="Đã quá hạn" value={stats.EXPIRED} tone="text-rose-600" />
          </div>

          <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-100 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {FILTERS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleFilterChange(item.value)}
                    className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                      filter === item.value
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                        : 'bg-gray-50 text-slate-600 hover:bg-gray-100 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex h-10 w-full items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm text-slate-600 lg:w-80">
                <Search size={16} className="shrink-0 text-slate-400" />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Tìm bài thi, môn học, giảng viên..."
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
                {keyword && (
                  <button
                    type="button"
                    onClick={() => setKeyword('')}
                    className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-gray-100 hover:text-slate-700"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {loading && <ExamMessage text="Đang tải danh sách bài thi..." />}
            {!loading && error && <ExamMessage text={error} action={load} />}
            {!loading && !error && exams.length === 0 && (
              <ExamMessage text="Không có bài thi phù hợp với bộ lọc." />
            )}
            {!loading && !error && exams.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-left text-sm">
                    <thead className="border-b border-gray-100 bg-gray-50 text-[11px] font-semibold uppercase text-slate-500">
                      <tr>
                        <th className="whitespace-nowrap px-5 py-3">Bài thi</th>
                        <th className="whitespace-nowrap px-5 py-3">Học phần</th>
                        <th className="whitespace-nowrap px-5 py-3">Thời gian</th>
                        <th className="whitespace-nowrap px-5 py-3">Thời lượng</th>
                        <th className="whitespace-nowrap px-5 py-3">Trạng thái</th>
                        <th className="whitespace-nowrap px-5 py-3 text-right">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {exams.map((exam) => {
                        const meta = statusMeta[exam.status]
                        const action = getExamAction(exam)

                        return (
                          <tr key={`${exam.courseOfferingId}-${exam.id}`} className="hover:bg-gray-50/70">
                            <td className="px-5 py-4">
                              <p className="font-bold text-slate-900">{exam.title}</p>
                              <p className="mt-0.5 text-xs text-slate-500">Giảng viên: {exam.teacherName}</p>
                            </td>
                            <td className="whitespace-nowrap px-5 py-4">
                              <p className="font-semibold text-slate-800">{exam.courseCode}</p>
                              <p className="mt-0.5 text-xs text-slate-500">{exam.subjectName}</p>
                            </td>
                            <td className="whitespace-nowrap px-5 py-4 text-slate-600">{formatExamTime(exam)}</td>
                            <td className="whitespace-nowrap px-5 py-4 text-slate-600">{exam.durationMinutes} phút</td>
                            <td className="whitespace-nowrap px-5 py-4">
                              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${meta.tone}`}>
                                {meta.icon}
                                {meta.label}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <button
                                type="button"
                                onClick={() => openExam(exam)}
                                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                                  action.primary
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                }`}
                              >
                                {action.primary ? <Play size={14} /> : <Eye size={14} />}
                                {action.label}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <ExamPagination pagination={pagination} onPageChange={setPage} />
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  )
}

function ExamMessage({ text, action }: { text: string; action?: () => void }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center gap-3 px-6 py-10 text-center text-sm text-slate-500">
      <Clock size={34} className="text-slate-300" />
      <span>{text}</span>
      {action && (
        <button type="button" onClick={action} className="inline-flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-700">
          <RefreshCw size={15} /> Thử lại
        </button>
      )}
    </div>
  )
}

function ExamPagination({ pagination, onPageChange }: { pagination: Pagination; onPageChange: (page: number) => void }) {
  if (pagination.totalPages <= 1) return null

  return (
    <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs font-medium text-slate-500">
        Trang {pagination.page}/{pagination.totalPages} · {pagination.totalItems} bài thi
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
          disabled={pagination.page <= 1}
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-slate-600 hover:bg-gray-50 disabled:opacity-50"
        >
          <ChevronLeft size={15} /> Trước
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
          disabled={pagination.page >= pagination.totalPages}
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-slate-600 hover:bg-gray-50 disabled:opacity-50"
        >
          Sau <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}

function getExamAction(exam: StudentExamListItem) {
  if (exam.canResume) return { label: 'Tiếp tục', primary: true }
  if (exam.canStart) return { label: 'Vào thi', primary: true }
  if (exam.status === 'COMPLETED') return { label: 'Xem kết quả', primary: false }
  return { label: 'Xem chi tiết', primary: false }
}

function formatExamTime(exam: StudentExamListItem) {
  const start = new Date(exam.startTime)
  const end = new Date(exam.endTime)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '-'

  const date = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(start)
  const time = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return `${date} · ${time.format(start)} - ${time.format(end)}`
}
