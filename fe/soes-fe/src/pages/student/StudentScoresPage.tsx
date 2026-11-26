import { BarChart3, ChevronLeft, ChevronRight, RefreshCw, Search, Trophy, X } from 'lucide-react'
import type React from 'react'
import { useNavigate } from 'react-router-dom'
import type { StudentScore } from './api/student-portal.api'
import { useStudentScorePage, SCORE_PAGE_SIZE as PAGE_SIZE } from './hooks/useStudentScorePage'
import AppSelect from '../../components/common/AppSelect'
import StudentSidebar from './components/StudentSidebar'
import StudentTopBar from './components/StudentTopBar'
import type { ExamType } from './types/course-detail.types'

type ScoreRow = StudentScore

const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  MIDTERM: 'Giữa kỳ',
  FINAL: 'Cuối kỳ',
  QUIZ: 'Quiz',
}

export default function StudentScoresPage() {
  const navigate = useNavigate()
  const {
    scores: visibleScores, subjects, semesterOptions, selectedSemesterId,
    selectedCourseOfferingId, setSelectedCourseOfferingId, keyword, setKeyword, page, setPage,
    totalItems, totalPages, averageScore, highestScore, loading, error, handleSemesterChange, load,
  } = useStudentScorePage()

  const openScoreDetail = (item: ScoreRow) => {
    navigate(`/student/course-offerings/${item.courseOfferingId}/exam-schedules/${item.examId}/result?attemptId=${item.attemptId}`)
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
                <BarChart3 size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-950">Điểm số</h1>
                <p className="mt-0.5 text-sm text-slate-500">Tổng hợp điểm đã công bố từ các lớp học phần.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw size={15} /> Làm mới
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Bài có điểm" value={totalItems} tone="text-blue-600" />
            <Metric label="Điểm trung bình" value={averageScore === null ? '-' : formatScore(averageScore)} tone="text-emerald-600" />
            <Metric label="Điểm cao nhất" value={highestScore === null ? '-' : formatScore(highestScore)} tone="text-amber-600" />
          </div>

          <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-100 p-4 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="text-sm font-bold text-slate-900">Bảng điểm đã công bố</h2>
              <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
                <AppSelect
                  value={selectedSemesterId}
                  options={semesterOptions.map((semester) => ({
                    value: semester.id,
                    label: `${semester.name}${semester.isCurrent ? ' (Hiện tại)' : ''}`,
                  }))}
                  onChange={handleSemesterChange}
                  disabled={semesterOptions.length === 0 || loading}
                  placeholder="Chọn học kỳ"
                  className="w-full sm:w-56"
                  buttonClassName="rounded-xl text-sm"
                />
                <AppSelect
                  value={selectedCourseOfferingId}
                  options={[
                    { value: 'ALL', label: 'Tất cả môn' },
                    ...subjects.map((subject) => ({
                      value: subject.courseOfferingId,
                      label: `${subject.subjectCode} - ${subject.subjectName}`,
                    })),
                  ]}
                  onChange={setSelectedCourseOfferingId}
                  disabled={subjects.length === 0 || loading}
                  placeholder="Chọn môn học"
                  className="w-full sm:w-64"
                  buttonClassName="rounded-xl text-sm"
                />
                <div className="flex h-10 w-full items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm text-slate-600 lg:w-80">
                  <Search size={16} className="shrink-0 text-slate-400" />
                  <input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="Tìm môn học hoặc bài thi..."
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                  {keyword && (
                    <button type="button" onClick={() => setKeyword('')} className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-gray-100 hover:text-slate-700">
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {loading && <Message icon={<BarChart3 size={34} />} text="Đang tải điểm số..." />}
            {!loading && error && <Message icon={<BarChart3 size={34} />} text={error} action={load} />}
            {!loading && !error && totalItems === 0 && (
              <Message icon={<Trophy size={34} />} text="Chưa có điểm phù hợp để hiển thị." />
            )}
            {!loading && !error && totalItems > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50 text-[11px] font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="whitespace-nowrap px-5 py-3">Bài đánh giá</th>
                      <th className="whitespace-nowrap px-5 py-3">Học phần</th>
                      <th className="whitespace-nowrap px-5 py-3">Loại</th>
                      <th className="whitespace-nowrap px-5 py-3">Công bố</th>
                      <th className="whitespace-nowrap px-5 py-3 text-right">Điểm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {visibleScores.map((item) => (
                      <tr
                        key={`${item.courseOfferingId}-${item.examId}`}
                        onClick={() => openScoreDetail(item)}
                        className="cursor-pointer hover:bg-gray-50/70"
                      >
                        <td className="px-5 py-4 font-bold text-slate-900">
                          {item.title}
                          {item.endedBy === 'PROCTOR' && (
                            <span className="mt-1 block w-fit rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">Giám thị buộc nộp</span>
                          )}
                          {item.forceSubmitReason && <span className="mt-1 block text-xs font-normal text-slate-500">Lý do: {item.forceSubmitReason}</span>}
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-800">{item.courseCode}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{item.subjectName}</p>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">{EXAM_TYPE_LABELS[item.type] ?? item.type}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">{formatDate(item.publishedAt)}</td>
                        <td className={`whitespace-nowrap px-5 py-4 text-right text-base font-bold ${scoreTone(item.score)}`}>
                          {formatScore(item.score)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!loading && !error && totalItems > PAGE_SIZE && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 text-sm text-slate-500">
                <span>Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalItems)} trên {totalItems} bài</span>
                <div className="flex items-center gap-2">
                  <button type="button" aria-label="Trang trước" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1} className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={16} /></button>
                  <span className="min-w-16 text-center font-semibold text-slate-700">{page} / {totalPages}</span>
                  <button type="button" aria-label="Trang sau" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages} className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight size={16} /></button>
                </div>
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

function Message({ icon, text, action }: { icon: React.ReactNode; text: string; action?: () => void }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center gap-3 px-6 py-10 text-center text-sm text-slate-500">
      <span className="text-slate-300">{icon}</span>
      <span>{text}</span>
      {action && (
        <button type="button" onClick={action} className="inline-flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-700">
          <RefreshCw size={15} /> Thử lại
        </button>
      )}
    </div>
  )
}

function formatScore(score: number) {
  return Number.isInteger(score) ? String(score) : score.toFixed(1)
}

function scoreTone(score: number) {
  if (score >= 8) return 'text-emerald-600'
  if (score >= 5) return 'text-amber-600'
  return 'text-rose-600'
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}
