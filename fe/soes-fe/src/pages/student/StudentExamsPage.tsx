import { AlertCircle, CalendarClock, CheckCircle2, ClipboardList, Clock, Eye, Play, RefreshCw, Search, Timer, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type React from 'react'
import { useNavigate } from 'react-router-dom'
import { getExamDetail, getTimeline } from './api/student-course-detail.api'
import { getStudentSubjects } from './api/student-subjects.api'
import StudentSidebar from './components/StudentSidebar'
import StudentTopBar from './components/StudentTopBar'
import type { ExamDetail, ExamTimelineItem } from './types/course-detail.types'
import type { SubjectCard } from './types/subjects.types'

type ExamFilter = 'ALL' | 'OPEN' | 'UPCOMING' | 'COMPLETED' | 'EXPIRED'

interface StudentExamListItem extends ExamTimelineItem {
  courseCode: string
  subjectName: string
  teacherName: string
  detail?: ExamDetail
}

const FILTERS: Array<{ value: ExamFilter; label: string }> = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'OPEN', label: 'Đang mở' },
  { value: 'UPCOMING', label: 'Sắp diễn ra' },
  { value: 'COMPLETED', label: 'Đã hoàn thành' },
  { value: 'EXPIRED', label: 'Đã quá hạn' },
]

const statusMeta: Record<Exclude<ExamFilter, 'ALL'>, { label: string; tone: string; icon: React.ReactNode }> = {
  OPEN: { label: 'Đang mở', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-100', icon: <Timer size={14} /> },
  UPCOMING: { label: 'Sắp diễn ra', tone: 'bg-blue-50 text-blue-700 ring-blue-100', icon: <CalendarClock size={14} /> },
  COMPLETED: { label: 'Đã hoàn thành', tone: 'bg-slate-100 text-slate-600 ring-slate-200', icon: <CheckCircle2 size={14} /> },
  EXPIRED: { label: 'Đã quá hạn', tone: 'bg-rose-50 text-rose-700 ring-rose-100', icon: <AlertCircle size={14} /> },
}

export default function StudentExamsPage() {
  const navigate = useNavigate()
  const [subjects, setSubjects] = useState<SubjectCard[]>([])
  const [exams, setExams] = useState<StudentExamListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')
  const [filter, setFilter] = useState<ExamFilter>('ALL')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const subjectData = await getStudentSubjects({ page: 1, pageSize: 100 })
      setSubjects(subjectData.items)

      const timelineResults = await Promise.all(
        subjectData.items.map(async (subject) => {
          const timeline = await getTimeline(subject.courseOfferingId, { page: 1, pageSize: 100 })
          const examItems = timeline.items
            .filter((item): item is ExamTimelineItem => item.type === 'EXAM')
          const details = await Promise.all(
            examItems.map((item) =>
              getExamDetail(subject.courseOfferingId, item.id).catch(() => null),
            ),
          )

          return examItems.map((item, index) => ({
            ...item,
            courseCode: subject.subjectCode,
            subjectName: subject.subjectName,
            teacherName: subject.teacherName,
            detail: details[index] ?? undefined,
          }))
        }),
      )

      setExams(timelineResults.flat())
    } catch {
      setError('Không thể tải danh sách bài thi.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const sortedExams = useMemo(() => [...exams].sort((first, second) => {
    const firstStatus = getExamStatus(first)
    const secondStatus = getExamStatus(second)
    const priority: Record<Exclude<ExamFilter, 'ALL'>, number> = {
      OPEN: 1,
      UPCOMING: 2,
      COMPLETED: 3,
      EXPIRED: 4,
    }
    const priorityDiff = priority[firstStatus] - priority[secondStatus]
    if (priorityDiff !== 0) return priorityDiff
    return new Date(first.startTime).getTime() - new Date(second.startTime).getTime()
  }), [exams])

  const filteredExams = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLocaleLowerCase('vi')
    return sortedExams.filter((exam) => {
      const status = getExamStatus(exam)
      const matchesFilter = filter === 'ALL' || status === filter
      const matchesKeyword = !normalizedKeyword || [
        exam.title,
        exam.courseCode,
        exam.subjectName,
        exam.teacherName,
      ].some((value) => value.toLocaleLowerCase('vi').includes(normalizedKeyword))
      return matchesFilter && matchesKeyword
    })
  }, [filter, keyword, sortedExams])

  const stats = useMemo(() => ({
    OPEN: exams.filter((exam) => getExamStatus(exam) === 'OPEN').length,
    UPCOMING: exams.filter((exam) => getExamStatus(exam) === 'UPCOMING').length,
    COMPLETED: exams.filter((exam) => getExamStatus(exam) === 'COMPLETED').length,
    EXPIRED: exams.filter((exam) => getExamStatus(exam) === 'EXPIRED').length,
  }), [exams])

  const openExam = (exam: StudentExamListItem) => {
    if (exam.detail?.status === 'SUBMITTED') {
      navigate(`/student/course-offerings/${exam.courseOfferingId}/exam-schedules/${exam.id}/result`, {
        state: { attemptId: exam.detail.attemptId },
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
                    onClick={() => setFilter(item.value)}
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
            {!loading && !error && filteredExams.length === 0 && (
              <ExamMessage text={subjects.length === 0 ? 'Bạn chưa có lớp học phần nào.' : 'Không có bài thi phù hợp với bộ lọc.'} />
            )}
            {!loading && !error && filteredExams.length > 0 && (
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
                    {filteredExams.map((exam) => {
                      const status = getExamStatus(exam)
                      const meta = statusMeta[status]
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

function getExamStatus(exam: StudentExamListItem): Exclude<ExamFilter, 'ALL'> {
  if (exam.detail?.status === 'SUBMITTED') return 'COMPLETED'
  if (exam.detail?.status === 'EXPIRED') return 'EXPIRED'
  if (exam.detail?.status === 'AVAILABLE') return 'OPEN'
  if (exam.detail?.status === 'NOT_STARTED') return 'UPCOMING'

  const now = Date.now()
  const start = new Date(exam.startTime).getTime()
  const end = new Date(exam.endTime).getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) return 'EXPIRED'
  if (now < start) return 'UPCOMING'
  if (now <= end) return 'OPEN'
  return 'EXPIRED'
}

function getExamAction(exam: StudentExamListItem) {
  if (exam.detail?.canResume) return { label: 'Tiếp tục', primary: true }
  if (exam.detail?.canStart) return { label: 'Vào thi', primary: true }
  if (exam.detail?.status === 'SUBMITTED') return { label: 'Xem kết quả', primary: false }
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
