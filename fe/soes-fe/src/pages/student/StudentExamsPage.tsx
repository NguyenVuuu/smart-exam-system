import { ClipboardList, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StudentSidebar from './components/StudentSidebar'
import StudentTopBar from './components/StudentTopBar'
import StudentExamCalendar from './components/exams/StudentExamCalendar'
import StudentExamDayDialog from './components/exams/StudentExamDayDialog'
import StudentExamState from './components/exams/StudentExamState'
import StudentExamSummary from './components/exams/StudentExamSummary'
import StudentExamTable from './components/exams/StudentExamTable'
import StudentExamToolbar from './components/exams/StudentExamToolbar'
import type { StudentExamItem } from './components/exams/student-exam.types'
import { useStudentExamsPage } from './hooks/useStudentExamsPage'

interface SelectedExamDay {
  date: Date
  exams: StudentExamItem[]
}

export default function StudentExamsPage() {
  const navigate = useNavigate()
  const model = useStudentExamsPage()
  const [visibleMonth, setVisibleMonth] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState<SelectedExamDay | null>(null)

  const openExam = (exam: StudentExamItem) => {
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
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <StudentTopBar />
        <main className="min-h-0 min-w-0 flex-1 space-y-5 overflow-y-auto px-6 py-7 lg:px-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <ClipboardList size={22} />
              </span>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-slate-950">Bài thi</h1>
                <p className="mt-1 text-sm text-slate-500">Theo dõi lịch thi và kết quả từ các lớp học phần.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void model.reload()}
              disabled={model.loading}
              className="inline-flex h-10 w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer transition-colors"
            >
              <RefreshCw size={15} className={model.loading ? 'animate-spin' : ''} />
              Làm mới
            </button>
          </header>

          <StudentExamSummary counts={model.stats} />

          <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xs">
            <StudentExamToolbar
              semesterOptions={model.semesterOptions}
              semesterId={model.selectedSemesterId}
              keyword={model.keyword}
              filter={model.filter}
              viewMode={model.viewMode}
              disabled={model.loading}
              onSemesterChange={(value) => {
                model.changeSemester(value)
                setSelectedDay(null)
              }}
              onKeywordChange={model.setKeyword}
              onFilterChange={(value) => {
                model.changeFilter(value)
                setSelectedDay(null)
              }}
              onViewModeChange={(value) => {
                model.changeViewMode(value)
                setSelectedDay(null)
              }}
            />

            <ExamContent
              model={model}
              visibleMonth={visibleMonth}
              selectedDay={selectedDay}
              onVisibleMonthChange={(date) => {
                setVisibleMonth(date)
                setSelectedDay(null)
              }}
              onSelectDay={(date, exams) => setSelectedDay({ date, exams })}
              onOpenExam={openExam}
            />
          </section>

          <StudentExamDayDialog
            date={selectedDay?.date ?? null}
            exams={selectedDay?.exams ?? []}
            onClose={() => setSelectedDay(null)}
            onOpenExam={openExam}
          />
        </main>
      </div>
    </div>
  )
}

interface ExamContentProps {
  model: ReturnType<typeof useStudentExamsPage>
  visibleMonth: Date
  selectedDay: SelectedExamDay | null
  onVisibleMonthChange: (date: Date) => void
  onSelectDay: (date: Date, exams: StudentExamItem[]) => void
  onOpenExam: (exam: StudentExamItem) => void
}

function ExamContent({
  model,
  visibleMonth,
  selectedDay,
  onVisibleMonthChange,
  onSelectDay,
  onOpenExam,
}: ExamContentProps) {
  if (model.loading) return <StudentExamState text="Đang tải danh sách bài thi..." />
  if (model.error) return <StudentExamState text={model.error} onRetry={model.reload} />
  if (model.exams.length === 0) return <StudentExamState text="Không có bài thi phù hợp với bộ lọc." />

  return (
    <div>
      {model.viewMode === 'CALENDAR' ? (
        <StudentExamCalendar
          exams={model.exams}
          visibleMonth={visibleMonth}
          selectedDate={selectedDay?.date}
          onVisibleMonthChange={onVisibleMonthChange}
          onSelectDay={onSelectDay}
        />
      ) : (
        <StudentExamTable
          exams={model.exams}
          pagination={model.pagination}
          onPageChange={model.setPage}
          onOpenExam={onOpenExam}
        />
      )}
    </div>
  )
}
