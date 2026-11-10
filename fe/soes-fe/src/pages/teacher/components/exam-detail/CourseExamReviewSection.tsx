import { FileCheck, RefreshCw, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import ViolationLogTable from '../proctoring/ViolationLogTable'
import type { Exam, ViolationRecord } from '../../types/teacher-exam.types'
import type { TeacherPaginationMeta } from '../../api/teacher-exams.api'

export type CourseReviewTab = 'submissions' | 'violations'

export function CourseSubmissionHeader({ exam, courseCode }: { exam: Exam; courseCode?: string }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-2xs">
      <p className="text-xs font-semibold uppercase text-blue-600">Kết quả ca thi</p>
      <div className="mt-2 min-w-0">
        <h1 className="truncate text-xl font-semibold leading-7 text-gray-950" title={exam.title}>
          {exam.title}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {courseCode ? `${courseCode} • ` : ''}{exam.subjectName} • {exam.totalPoints} điểm
        </p>
      </div>
    </section>
  )
}

export function CourseReviewTabs({
  activeTab,
  onChange,
}: {
  activeTab: CourseReviewTab
  onChange: (tab: CourseReviewTab) => void
}) {
  const tabs = [
    { id: 'submissions' as const, label: 'Bài nộp & Kết quả', icon: FileCheck },
    { id: 'violations' as const, label: 'Nhật ký vi phạm', icon: ShieldAlert },
  ]

  return (
    <nav className="flex gap-1 border-b border-gray-200" aria-label="Nội dung bài thi của lớp">
      {tabs.map(({ id, label, icon: Icon }) => {
        const active = activeTab === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`inline-flex cursor-pointer items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              active
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800'
            }`}
          >
            <Icon size={17} />
            {label}
          </button>
        )
      })}
    </nav>
  )
}

export function CourseReviewUnavailable({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
      <p className="text-base font-semibold text-gray-900">{title}</p>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  )
}

export function CourseViolationLog({
  violations,
  pagination,
  loading,
  error,
  onPageChange,
  onRefresh,
  onViewEvidence,
  makeupViolations,
  makeupPagination,
  makeupLoading,
  makeupError,
  onMakeupPageChange,
  onMakeupRefresh,
}: {
  violations: ViolationRecord[]
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number }
  loading: boolean
  error: string | null
  onPageChange: (page: number) => void
  onRefresh: () => void
  onViewEvidence: (url: string) => void
  /** Violations ca dự phòng — chỉ truyền khi có ca dự phòng */
  makeupViolations?: ViolationRecord[]
  makeupPagination?: TeacherPaginationMeta
  makeupLoading?: boolean
  makeupError?: string | null
  onMakeupPageChange?: (page: number) => void
  onMakeupRefresh?: () => void
}) {
  const hasMakeup = makeupViolations !== undefined
  const [activeTab, setActiveTab] = useState<'source' | 'makeup'>('source')

  const currentViolations = activeTab === 'source' ? violations : (makeupViolations ?? [])
  const currentPagination = activeTab === 'source' ? pagination : (makeupPagination ?? pagination)
  const currentLoading = activeTab === 'source' ? loading : (makeupLoading ?? false)
  const currentError = activeTab === 'source' ? error : (makeupError ?? null)
  const currentOnPageChange = activeTab === 'source' ? onPageChange : (onMakeupPageChange ?? onPageChange)
  const currentOnRefresh = activeTab === 'source' ? onRefresh : (onMakeupRefresh ?? onRefresh)

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xs">
      <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
            <ShieldAlert size={18} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Nhật ký vi phạm của lớp</h2>
            {hasMakeup && (
              <p className="mt-0.5 text-xs text-gray-500">
                {activeTab === 'source' ? 'Đang xem ca thi gốc' : 'Đang xem ca thi dự phòng'}
              </p>
            )}
          </div>
        </div>

        {/* Toggle tab — chỉ hiện khi có ca dự phòng */}
        {hasMakeup && (
          <div className="inline-flex self-start rounded-xl border border-gray-200 bg-gray-50 p-1 sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('source')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === 'source'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Ca gốc
              <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                activeTab === 'source' ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-500'
              }`}>
                {pagination.totalItems}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('makeup')}
              className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === 'makeup'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <RefreshCw size={11} />
              Ca dự phòng
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                activeTab === 'makeup' ? 'bg-violet-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {makeupPagination?.totalItems ?? 0}
              </span>
            </button>
          </div>
        )}
      </div>

      <ViolationLogTable
        violations={currentViolations}
        onViewEvidence={onViewEvidence}
        loading={currentLoading}
        error={currentError}
        onRefresh={currentOnRefresh}
        emptyText={
          activeTab === 'makeup'
            ? 'Chưa ghi nhận vi phạm trong ca thi dự phòng.'
            : 'Chưa ghi nhận vi phạm trong ca thi này.'
        }
        pagination={currentPagination}
        onPageChange={currentOnPageChange}
      />
    </section>
  )
}
