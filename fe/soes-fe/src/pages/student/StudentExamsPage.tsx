import {
  AlertCircle,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Eye,
  List,
  Play,
  RefreshCw,
  Search,
  Timer,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type React from 'react'
import { useNavigate } from 'react-router-dom'
import AppSelect from '../../components/common/AppSelect'
import {
  getStudentExamSchedules,
  type StudentExamSchedule,
  type StudentExamStatusCounts,
} from './api/student-portal.api'
import { getStudentSubjects } from './api/student-subjects.api'
import StudentSidebar from './components/StudentSidebar'
import StudentTopBar from './components/StudentTopBar'
import type { Pagination } from './types/course-detail.types'
import type { SemesterOption } from './types/subjects.types'

type ExamFilter = 'ALL' | 'OPEN' | 'UPCOMING' | 'COMPLETED' | 'EXPIRED'
type StudentExamListItem = StudentExamSchedule
type StudentViewMode = 'CALENDAR' | 'LIST'

const PAGE_SIZE = 10

const FILTERS: Array<{ value: ExamFilter; label: string }> = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'OPEN', label: 'Đang mở' },
  { value: 'UPCOMING', label: 'Sắp diễn ra' },
  { value: 'COMPLETED', label: 'Đã hoàn thành' },
  { value: 'EXPIRED', label: 'Đã quá hạn' },
]

const WEEKDAYS = ['THỨ 2', 'THỨ 3', 'THỨ 4', 'THỨ 5', 'THỨ 6', 'THỨ 7', 'CHỦ NHẬT']

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
  const [semesterOptions, setSemesterOptions] = useState<SemesterOption[]>([])
  const [selectedSemesterId, setSelectedSemesterId] = useState('')
  const [visibleMonth, setVisibleMonth] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState<{ date: Date; items: StudentExamListItem[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [filter, setFilter] = useState<ExamFilter>('ALL')
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<StudentViewMode>('CALENDAR')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAppliedKeyword(keyword.trim())
      setPage(1)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [keyword])

  useEffect(() => {
    let cancelled = false
    getStudentSubjects({ page: 1, pageSize: 1 })
      .then((data) => {
        if (cancelled) return
        setSemesterOptions(data.semesterOptions)
        const currentId = data.currentSemesterId || data.semesterOptions.find((semester) => semester.isCurrent)?.id || data.semesterOptions[0]?.id || ''
        setSelectedSemesterId((prev) => prev || currentId)
      })
      .catch(() => {
        if (!cancelled) setSemesterOptions([])
      })

    return () => {
      cancelled = true
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getStudentExamSchedules({
        page: viewMode === 'LIST' ? page : 1,
        pageSize: viewMode === 'LIST' ? PAGE_SIZE : 100,
        status: filter,
        semesterId: selectedSemesterId || undefined,
        keyword: viewMode === 'LIST' ? appliedKeyword || undefined : undefined,
      })
      setExams(data.items)
      setPagination(data.pagination)
      setStatusCounts(data.statusCounts)
    } catch {
      setError('Không thể tải danh sách bài thi.')
    } finally {
      setLoading(false)
    }
  }, [appliedKeyword, filter, page, selectedSemesterId, viewMode])

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

  const handleViewModeChange = (mode: StudentViewMode) => {
    setViewMode(mode)
    setSelectedDay(null)
    setPage(1)
  }

  const handleSemesterChange = (semesterId: string) => {
    setSelectedSemesterId(semesterId)
    setSelectedDay(null)
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
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Làm mới
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Đang mở" value={stats.OPEN} tone="text-emerald-600" />
            <Metric label="Sắp diễn ra" value={stats.UPCOMING} tone="text-blue-600" />
            <Metric label="Đã hoàn thành" value={stats.COMPLETED} tone="text-slate-600" />
            <Metric label="Đã quá hạn" value={stats.EXPIRED} tone="text-rose-600" />
          </div>

          <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-100 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <AppSelect
                  value={selectedSemesterId}
                  onChange={handleSemesterChange}
                  className="w-64"
                  disabled={semesterOptions.length === 0}
                  placeholder="Chưa có học kỳ hiện tại"
                  options={semesterOptions.map((semester) => ({
                    value: semester.id,
                    label: `${semester.name}${semester.isCurrent ? ' (Hiện tại)' : ''}`,
                  }))}
                />
                {viewMode === 'LIST' ? (
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
                ) : (
                  <p className="text-xs font-medium text-slate-500 sm:text-sm">
                    Nhấp vào bất kỳ ngày nào trên lịch để xem chi tiết các ca thi.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {viewMode === 'LIST' && (
                  <>
                    <button
                      type="button"
                      onClick={() => void load()}
                      disabled={loading}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
                      title="Làm mới bộ lọc"
                    >
                      <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>

                    <div className="flex h-10 w-full min-w-[240px] items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm text-slate-600 sm:w-72">
                      <Search size={16} className="shrink-0 text-slate-400" />
                      <input
                        value={keyword}
                        onChange={(event) => setKeyword(event.target.value)}
                        placeholder="Tìm bài thi, môn hoặc giảng viên..."
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
                  </>
                )}

                <div className="flex items-center rounded-xl border border-gray-200 bg-gray-100/70 p-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleViewModeChange('CALENDAR')}
                    className={`flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition-all ${
                      viewMode === 'CALENDAR'
                        ? 'bg-white font-bold text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Calendar size={16} />
                    <span>Dạng Lịch</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleViewModeChange('LIST')}
                    className={`flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition-all ${
                      viewMode === 'LIST'
                        ? 'bg-white font-bold text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <List size={16} />
                    <span>Dạng Bảng</span>
                  </button>
                </div>
              </div>
            </div>

            {loading && <ExamMessage text="Đang tải danh sách bài thi..." />}
            {!loading && error && <ExamMessage text={error} action={load} />}
            {!loading && !error && exams.length === 0 && (
              <ExamMessage text="Không có bài thi phù hợp với bộ lọc." />
            )}
            {!loading && !error && exams.length > 0 && viewMode === 'CALENDAR' && (
              <div className="p-3 sm:p-4">
                <StudentExamCalendar
                  exams={exams}
                  visibleMonth={visibleMonth}
                  selectedDate={selectedDay?.date}
                  onVisibleMonthChange={(date) => {
                    setVisibleMonth(date)
                    setSelectedDay(null)
                  }}
                  onSelectDay={(date, items) => setSelectedDay({ date, items })}
                />
              </div>
            )}
            {!loading && !error && exams.length > 0 && viewMode === 'LIST' && (
              <>
                <StudentExamTable exams={exams} onOpenExam={openExam} />
                <ExamPagination pagination={pagination} onPageChange={setPage} />
              </>
            )}
          </section>

          <StudentDayDetailModal
            date={selectedDay?.date ?? null}
            exams={selectedDay?.items ?? []}
            isOpen={Boolean(selectedDay)}
            onClose={() => setSelectedDay(null)}
            onOpenExam={openExam}
          />
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

function StudentExamTable({ exams, onOpenExam }: { exams: StudentExamListItem[]; onOpenExam: (exam: StudentExamListItem) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="border-y border-gray-100 bg-gray-50 text-[11px] font-semibold uppercase text-slate-500">
          <tr>
            <th className="whitespace-nowrap px-6 py-3.5">Bài thi</th>
            <th className="whitespace-nowrap px-6 py-3.5">Học phần</th>
            <th className="whitespace-nowrap px-6 py-3.5">Thời gian</th>
            <th className="whitespace-nowrap px-6 py-3.5">Thời lượng</th>
            <th className="whitespace-nowrap px-6 py-3.5">Trạng thái</th>
            <th className="whitespace-nowrap px-6 py-3.5 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {exams.map((exam) => {
            const meta = statusMeta[exam.status]
            const action = getExamAction(exam)

            return (
              <tr key={`${exam.courseOfferingId}-${exam.id}`} className="transition-colors hover:bg-gray-50/60">
                <td className="px-6 py-4">
                  <p className="font-semibold text-slate-900">{exam.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">Giảng viên: {exam.teacherName}</p>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <p className="font-normal text-slate-700">{exam.courseCode}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{exam.subjectName}</p>
                </td>
                <td className="whitespace-nowrap px-6 py-4 font-normal text-slate-700">{formatExamTime(exam)}</td>
                <td className="whitespace-nowrap px-6 py-4 font-normal text-slate-700">{exam.durationMinutes} phút</td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${meta.tone}`}>
                    {meta.icon}
                    {meta.label}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => onOpenExam(exam)}
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

function StudentExamCalendar({
  exams,
  visibleMonth,
  selectedDate,
  onVisibleMonthChange,
  onSelectDay,
}: {
  exams: StudentExamListItem[]
  visibleMonth: Date
  selectedDate?: Date | null
  onVisibleMonthChange: (date: Date) => void
  onSelectDay: (date: Date, exams: StudentExamListItem[]) => void
}) {
  const calendarDays = useMemo(() => getStudentCalendarDays(visibleMonth, exams), [exams, visibleMonth])
  const selectedDateString = selectedDate ? formatDateToYMD(selectedDate) : null
  const currentMonth = visibleMonth.getMonth()
  const currentYear = visibleMonth.getFullYear()
  const currentMonthTitle = `Tháng ${String(currentMonth + 1).padStart(2, '0')}, ${currentYear}`
  const currentMonthExamCount = calendarDays
    .filter((day) => day.isCurrentMonth)
    .reduce((sum, day) => sum + day.exams.length, 0)

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onVisibleMonthChange(new Date())}
              className="h-9 rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-gray-50"
            >
              Hôm nay
            </button>
            <div className="flex items-center rounded-xl border border-gray-200 bg-white p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => onVisibleMonthChange(new Date(currentYear, currentMonth - 1, 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-gray-100"
                title="Tháng trước"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => onVisibleMonthChange(new Date(currentYear, currentMonth + 1, 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-gray-100"
                title="Tháng sau"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">{currentMonthTitle}</h2>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700">
          <Calendar size={14} />
          <span>Có <strong>{currentMonthExamCount}</strong> ca thi trong tháng</span>
        </span>
      </div>

      <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50 py-3 text-center text-[12px] font-bold uppercase tracking-wide text-slate-500">
        {WEEKDAYS.map((day) => <div key={day}>{day}</div>)}
      </div>

      <div className="grid grid-cols-7 divide-x divide-y divide-gray-100 bg-gray-100/60">
        {calendarDays.map((cell) => (
          <StudentCalendarDayCell
            key={cell.dateString}
            cell={cell}
            isSelected={selectedDateString === cell.dateString}
            onSelectDay={onSelectDay}
          />
        ))}
      </div>
    </div>
  )
}

function StudentCalendarDayCell({
  cell,
  isSelected,
  onSelectDay,
}: {
  cell: StudentCalendarDay
  isSelected: boolean
  onSelectDay: (date: Date, exams: StudentExamListItem[]) => void
}) {
  const hasExams = cell.exams.length > 0
  const visibleExams = cell.exams.slice(0, 2)
  const remainingCount = cell.exams.length - visibleExams.length
  const hasOpen = cell.exams.some((exam) => exam.status === 'OPEN')
  const hasUpcoming = cell.exams.some((exam) => exam.status === 'UPCOMING')

  return (
    <div
      onClick={() => onSelectDay(cell.date, cell.exams)}
      className={`group relative flex min-h-[115px] cursor-pointer flex-col justify-between p-2.5 transition-all sm:min-h-[130px] ${
        isSelected
          ? 'z-10 bg-blue-50/90 shadow-xs ring-2 ring-inset ring-blue-600'
          : cell.isCurrentMonth
            ? 'bg-white hover:bg-blue-50/40'
            : 'bg-gray-50/70 text-slate-400'
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all ${
            cell.isToday
              ? 'bg-blue-600 text-white shadow-xs'
              : isSelected
                ? 'bg-blue-700 text-white'
                : cell.isCurrentMonth
                  ? 'text-slate-800'
                  : 'text-slate-400'
          }`}
        >
          {cell.dayNumber}
        </span>

        {hasExams && (
          <span
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-2xs ${
              hasOpen
                ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300'
                : hasUpcoming
                  ? 'bg-blue-100 text-blue-700'
                  : 'border border-slate-200/80 bg-slate-100 text-slate-600'
            }`}
          >
            {cell.exams.length} ca
          </span>
        )}
      </div>

      <div className="mt-1.5 flex flex-1 flex-col gap-1">
        {visibleExams.map((exam) => {
          const isOpen = exam.status === 'OPEN'
          const isUpcoming = exam.status === 'UPCOMING'
          return (
            <div
              key={`${exam.courseOfferingId}-${exam.id}`}
              className={`flex items-center gap-1.5 truncate rounded-lg border px-2 py-0.5 text-[11px] leading-tight shadow-2xs transition-all ${
                isOpen
                  ? 'border-emerald-400 bg-emerald-50 font-bold text-emerald-700'
                  : isUpcoming
                    ? 'border-sky-400 bg-sky-50 font-semibold text-sky-700'
                    : 'border-slate-300 bg-slate-50 font-medium text-slate-500'
              }`}
            >
              {isOpen ? (
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
              ) : (
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isUpcoming ? 'bg-sky-500' : 'bg-slate-400'}`} />
              )}
              <span className="truncate">{formatClock(exam.startTime)} · {exam.courseCode}</span>
            </div>
          )
        })}

        {remainingCount > 0 && (
          <span className={`pl-1 text-[10px] font-bold hover:underline ${hasOpen || hasUpcoming ? 'text-blue-600 hover:text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>
            +{remainingCount} ca thi khác...
          </span>
        )}
      </div>
    </div>
  )
}

function StudentDayDetailModal({
  isOpen,
  date,
  exams,
  onClose,
  onOpenExam,
}: {
  isOpen: boolean
  date: Date | null
  exams: StudentExamListItem[]
  onClose: () => void
  onOpenExam: (exam: StudentExamListItem) => void
}) {
  if (!isOpen || !date) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">{formatFullDate(date)}</h3>
            <p className="mt-0.5 text-sm text-slate-500">{exams.length} ca thi</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-gray-100 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[60vh] space-y-3 overflow-y-auto p-5">
          {exams.length === 0 ? (
            <p className="rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-slate-500">Không có ca thi trong ngày này.</p>
          ) : exams.map((exam) => {
            const meta = statusMeta[exam.status]
            const action = getExamAction(exam)
            return (
              <div key={`${exam.courseOfferingId}-${exam.id}`} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900">{exam.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{exam.courseCode} · {exam.subjectName}</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">{formatTimeRange(exam.startTime, exam.endTime)} · {exam.durationMinutes} phút</p>
                  </div>
                  <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${meta.tone}`}>
                    {meta.icon}
                    {meta.label}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenExam(exam)}
                  className={`mt-4 inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                    action.primary
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  {action.primary ? <Play size={14} /> : <Eye size={14} />}
                  {action.label}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface StudentCalendarDay {
  date: Date
  dateString: string
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  exams: StudentExamListItem[]
}

function getStudentCalendarDays(currentMonthDate: Date, exams: StudentExamListItem[]): StudentCalendarDay[] {
  const year = currentMonthDate.getFullYear()
  const month = currentMonthDate.getMonth()
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const totalDaysInMonth = lastDayOfMonth.getDate()
  const examMap = new Map<string, StudentExamListItem[]>()

  for (const exam of exams) {
    const date = new Date(exam.startTime)
    if (Number.isNaN(date.getTime())) continue
    const key = formatDateToYMD(date)
    const list = examMap.get(key) || []
    list.push(exam)
    examMap.set(key, list)
  }

  examMap.forEach((list) => {
    list.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  })

  const todayString = formatDateToYMD(new Date())
  const days: StudentCalendarDay[] = []
  let startDayOfWeek = firstDayOfMonth.getDay() - 1
  if (startDayOfWeek === -1) startDayOfWeek = 6

  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayNumber = prevMonthLastDay - i
    const date = new Date(year, month - 1, dayNumber)
    const dateString = formatDateToYMD(date)
    days.push({
      date,
      dateString,
      dayNumber,
      isCurrentMonth: false,
      isToday: dateString === todayString,
      exams: examMap.get(dateString) || [],
    })
  }

  for (let dayNumber = 1; dayNumber <= totalDaysInMonth; dayNumber++) {
    const date = new Date(year, month, dayNumber)
    const dateString = formatDateToYMD(date)
    days.push({
      date,
      dateString,
      dayNumber,
      isCurrentMonth: true,
      isToday: dateString === todayString,
      exams: examMap.get(dateString) || [],
    })
  }

  const targetCellCount = days.length > 35 ? 42 : 35
  for (let dayNumber = 1; days.length < targetCellCount; dayNumber++) {
    const date = new Date(year, month + 1, dayNumber)
    const dateString = formatDateToYMD(date)
    days.push({
      date,
      dateString,
      dayNumber,
      isCurrentMonth: false,
      isToday: dateString === todayString,
      exams: examMap.get(dateString) || [],
    })
  }

  return days
}

function formatDateToYMD(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatClock(value: string) {
  return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value))
}

function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatClock(startTime)} - ${formatClock(endTime)}`
}

function formatFullDate(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
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

  return `${date} · ${formatTimeRange(exam.startTime, exam.endTime)}`
}
