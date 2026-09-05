import { Calendar, CalendarClock, List, RefreshCw, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppSelect from '../../components/common/AppSelect'
import TeacherPageHeader from './components/TeacherPageHeader'
import TeacherPagination from './components/TeacherPagination'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTablePanel from './components/TeacherTablePanel'
import TeacherTopBar from './components/TeacherTopBar'
import TeacherCalendarView from './components/invigilation-schedule/TeacherCalendarView'
import TeacherDayDetailModal from './components/invigilation-schedule/TeacherDayDetailModal'
import TeacherScheduleStats from './components/invigilation-schedule/TeacherScheduleStats'
import TeacherScheduleTableView from './components/invigilation-schedule/TeacherScheduleTableView'
import { useTeacherProctorAssignments } from './hooks/useTeacherProctorAssignments'
import type {
  ProctorAssignmentApiDto,
  ProctorAssignmentStatus,
} from './types/teacher-course-api.types'

const statusMeta: Record<ProctorAssignmentStatus, { label: string; tone: 'blue' | 'emerald' | 'gray' | 'rose' }> = {
  SCHEDULED: { label: 'Đã lên lịch', tone: 'blue' },
  OPEN: { label: 'Đang diễn ra', tone: 'emerald' },
  CLOSED: { label: 'Đã kết thúc', tone: 'gray' },
  CANCELLED: { label: 'Đã hủy', tone: 'rose' },
}

const STATUS_PRIORITY: Record<ProctorAssignmentStatus, number> = {
  OPEN: 1,
  SCHEDULED: 2,
  CLOSED: 3,
  CANCELLED: 4,
}

const PAGE_SIZE = 10

export default function TeacherInvigilationSchedulePage() {
  const navigate = useNavigate()
  const { assignments, loading, error, retry } = useTeacherProctorAssignments()
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar')
  const [status, setStatus] = useState('ALL')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)

  // State for Day Detail Modal in Calendar View
  const [selectedDay, setSelectedDay] = useState<{ date: Date; items: ProctorAssignmentApiDto[] } | null>(null)

  const filteredAssignments = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLocaleLowerCase('vi')
    const filtered = assignments.filter((assignment) => {
      const matchesStatus = status === 'ALL' || assignment.status === status
      const matchesKeyword = !normalizedKeyword || [
        assignment.title,
        assignment.courseOffering.code,
        assignment.courseOffering.subjectName,
      ].some((value) => value.toLocaleLowerCase('vi').includes(normalizedKeyword))
      return matchesStatus && matchesKeyword
    })

    return filtered.sort((a, b) => {
      const pA = STATUS_PRIORITY[a.status] ?? 99
      const pB = STATUS_PRIORITY[b.status] ?? 99
      if (pA !== pB) return pA - pB

      const timeA = new Date(a.startTime).getTime()
      const timeB = new Date(b.startTime).getTime()

      // For CLOSED exams, show most recently closed first (descending)
      if (a.status === 'CLOSED' && b.status === 'CLOSED') {
        return timeB - timeA
      }

      // For OPEN and SCHEDULED, show soonest first (ascending)
      return timeA - timeB
    })
  }, [assignments, keyword, status])

  const totalPages = Math.max(1, Math.ceil(filteredAssignments.length / PAGE_SIZE))

  const paginatedAssignments = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredAssignments.slice(start, start + PAGE_SIZE)
  }, [filteredAssignments, page])

  const openProctoring = (assignment: ProctorAssignmentApiDto) => {
    navigate(`/teacher/proctoring?scheduleId=${encodeURIComponent(assignment.scheduleId)}&courseOfferingId=${encodeURIComponent(assignment.courseOffering.id)}`)
  }

  const handleSelectDay = (date: Date, items: ProctorAssignmentApiDto[]) => {
    setSelectedDay({ date, items })
  }

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus)
    setPage(1)
  }

  const handleKeywordChange = (newKeyword: string) => {
    setKeyword(newKeyword)
    setPage(1)
  }

  const handleReset = () => {
    setStatus('ALL')
    setKeyword('')
    setPage(1)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">
      <TeacherSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TeacherTopBar />
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-6 py-7 lg:px-8">
          <TeacherPageHeader
            title="Lịch coi thi"
            description="Theo dõi lịch coi thi trực quan theo dạng lịch hoặc bảng danh sách tổng hợp."
            icon={<CalendarClock size={21} />}
          />

          {/* Quick stats counter */}
          <TeacherScheduleStats assignments={assignments} />

          <TeacherTablePanel>
            {/* Unified Fixed-Position Toolbar */}
            <div className="flex flex-col gap-3 border-b border-gray-100 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Left Side: Filter (Table mode) or Hint (Calendar mode) */}
              <div className="flex flex-wrap items-center gap-3">
                {viewMode === 'table' ? (
                  <AppSelect
                    value={status}
                    onChange={handleStatusChange}
                    className="w-48"
                    options={[
                      { value: 'ALL', label: 'Tất cả trạng thái' },
                      { value: 'SCHEDULED', label: 'Đã lên lịch' },
                      { value: 'OPEN', label: 'Đang diễn ra' },
                      { value: 'CLOSED', label: 'Đã kết thúc' },
                    ]}
                  />
                ) : (
                  <p className="text-xs sm:text-sm font-medium text-slate-500">
                    Nhấp vào bất kỳ ngày nào trên lịch để xem chi tiết các ca coi thi.
                  </p>
                )}
              </div>

              {/* Right Side: Search + Reset + FIXED VIEW MODE TOGGLE */}
              <div className="flex flex-wrap items-center gap-2.5">
                {viewMode === 'table' && (
                  <>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
                      title="Làm mới bộ lọc"
                    >
                      <RefreshCw size={16} />
                    </button>

                    <div className="flex h-10 w-full min-w-[240px] sm:w-72 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm text-slate-600">
                      <Search size={16} className="shrink-0 text-slate-400" />
                      <input
                        value={keyword}
                        onChange={(e) => handleKeywordChange(e.target.value)}
                        placeholder="Tìm ca thi, môn hoặc mã lớp..."
                        className="min-w-0 flex-1 bg-transparent text-sm font-normal outline-none placeholder:text-slate-400"
                      />
                      {keyword && (
                        <button
                          type="button"
                          onClick={() => handleKeywordChange('')}
                          className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-gray-100 hover:text-slate-700"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </>
                )}

                {/* View Mode Toggle: Always stays in the exact same spot on the far right */}
                <div className="flex items-center rounded-xl border border-gray-200 bg-gray-100/70 p-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setViewMode('calendar')}
                    className={`flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition-all ${
                      viewMode === 'calendar'
                        ? 'bg-white text-blue-700 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Calendar size={16} />
                    <span>Dạng Lịch</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition-all ${
                      viewMode === 'table'
                        ? 'bg-white text-blue-700 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <List size={16} />
                    <span>Dạng Bảng</span>
                  </button>
                </div>
              </div>
            </div>

            {loading && <ScheduleMessage message="Đang tải lịch coi thi..." />}
            {error && <ScheduleMessage message={error} action={retry} />}

            {!loading && !error && (
              viewMode === 'calendar' ? (
                <div className="p-3 sm:p-4">
                  <TeacherCalendarView
                    assignments={assignments}
                    selectedDate={selectedDay?.date}
                    onSelectDay={handleSelectDay}
                  />
                </div>
              ) : filteredAssignments.length === 0 ? (
                <ScheduleMessage message="Không có ca thi phù hợp với bộ lọc." />
              ) : (
                <>
                  <TeacherScheduleTableView
                    assignments={paginatedAssignments}
                    statusMeta={statusMeta}
                    onOpenProctoring={openProctoring}
                  />
                  <TeacherPagination
                    page={page}
                    totalPages={totalPages}
                    totalItems={filteredAssignments.length}
                    onChange={setPage}
                  />
                </>
              )
            )}
          </TeacherTablePanel>

          {/* Large Day Detail Modal */}
          <TeacherDayDetailModal
            isOpen={Boolean(selectedDay)}
            date={selectedDay?.date ?? null}
            assignments={selectedDay?.items ?? []}
            statusMeta={statusMeta}
            onClose={() => setSelectedDay(null)}
            onOpenProctoring={openProctoring}
          />
        </main>
      </div>
    </div>
  )
}

function ScheduleMessage({ message, action }: { message: string; action?: () => void }) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center gap-3 px-6 py-10 text-sm text-slate-500">
      <span>{message}</span>
      {action && (
        <button type="button" onClick={action} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold">
          <RefreshCw size={15} /> Thử lại
        </button>
      )}
    </div>
  )
}
