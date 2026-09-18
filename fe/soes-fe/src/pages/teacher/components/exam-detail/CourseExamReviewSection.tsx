import { FileCheck, ShieldAlert } from 'lucide-react'
import ViolationLogTable from '../proctoring/ViolationLogTable'
import type { Exam, ViolationRecord } from '../../types/teacher-exam.types'

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
}: {
  violations: ViolationRecord[]
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number }
  loading: boolean
  error: string | null
  onPageChange: (page: number) => void
  onRefresh: () => void
  onViewEvidence: (url: string) => void
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xs">
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
          <ShieldAlert size={18} />
        </span>
        <div>
          <h2 className="text-base font-semibold text-gray-900">Nhật ký vi phạm của lớp</h2>
          <p className="text-sm text-gray-500">Chỉ hiển thị sự kiện của sinh viên trong ca thi đang xem.</p>
        </div>
      </div>

      <ViolationLogTable
        violations={violations}
        onViewEvidence={onViewEvidence}
        loading={loading}
        error={error}
        onRefresh={onRefresh}
        emptyText="Chưa ghi nhận vi phạm trong ca thi này."
        pagination={pagination}
        onPageChange={onPageChange}
      />
    </section>
  )
}
