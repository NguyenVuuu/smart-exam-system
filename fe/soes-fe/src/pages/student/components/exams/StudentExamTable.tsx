import { ChevronLeft, ChevronRight, Eye, Play } from 'lucide-react'
import type { Pagination } from '../../types/course-detail.types'
import StudentExamStatusBadge from './StudentExamStatusBadge'
import type { StudentExamItem } from './student-exam.types'
import { formatExamTime, getStudentExamAction } from './student-exam.utils'

export default function StudentExamTable({
  exams,
  pagination,
  onOpenExam,
  onPageChange,
}: {
  exams: StudentExamItem[]
  pagination: Pagination
  onOpenExam: (exam: StudentExamItem) => void
  onPageChange: (page: number) => void
}) {
  return (
    <>
      <div className="overflow-x-auto lg:overflow-x-clip">
        <table className="w-full min-w-[860px] table-fixed border-collapse text-left text-sm lg:min-w-0">
          <colgroup>
            <col className="w-[24%]" />
            <col className="w-[17%]" />
            <col className="w-[21%]" />
            <col className="w-[10%]" />
            <col className="w-[15%]" />
            <col className="w-[13%]" />
          </colgroup>
          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3.5">Bài thi</th>
              <th className="px-5 py-3.5">Học phần</th>
              <th className="px-5 py-3.5">Thời gian</th>
              <th className="px-5 py-3.5">Thời lượng</th>
              <th className="px-5 py-3.5">Trạng thái</th>
              <th className="px-5 py-3.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {exams.map((exam) => (
              <ExamRow key={`${exam.courseOfferingId}-${exam.id}`} exam={exam} onOpenExam={onOpenExam} />
            ))}
          </tbody>
        </table>
      </div>
      <ExamPagination pagination={pagination} onPageChange={onPageChange} />
    </>
  )
}

function ExamRow({ exam, onOpenExam }: { exam: StudentExamItem; onOpenExam: (exam: StudentExamItem) => void }) {
  const action = getStudentExamAction(exam)
  const formattedTime = formatExamTime(exam)

  return (
    <tr className="hover:bg-slate-50/70">
      <td className="px-5 py-4 align-top">
        <p className="truncate font-semibold text-slate-900" title={exam.title}>{exam.title}</p>
        <p className="mt-1 truncate text-xs text-slate-500" title={exam.teacherName}>Giảng viên: {exam.teacherName}</p>
      </td>
      <td className="px-5 py-4 align-top">
        <p className="truncate font-medium text-slate-700" title={exam.courseCode}>{exam.courseCode}</p>
        <p className="mt-1 truncate text-xs text-slate-500" title={exam.subjectName}>{exam.subjectName}</p>
      </td>
      <td className="px-5 py-4 text-slate-700">
        <p className="truncate" title={formattedTime}>{formattedTime}</p>
      </td>
      <td className="whitespace-nowrap px-5 py-4 text-slate-700">{exam.durationMinutes} phút</td>
      <td className="px-5 py-4"><StudentExamStatusBadge status={exam.status} /></td>
      <td className="px-5 py-4 text-right">
        <button
          type="button"
          onClick={() => onOpenExam(exam)}
          className={`inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-lg px-3 text-xs font-semibold ${
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
}

function ExamPagination({ pagination, onPageChange }: { pagination: Pagination; onPageChange: (page: number) => void }) {
  if (pagination.totalPages <= 1) return null

  return (
    <div className="flex min-h-16 items-center justify-between gap-3 border-t border-slate-200 px-5 py-3">
      <p className="text-xs font-medium text-slate-500">
        Trang {pagination.page}/{pagination.totalPages} · {pagination.totalItems} bài thi
      </p>
      <div className="flex items-center gap-2">
        <PageButton
          label="Trang trước"
          disabled={pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
        >
          <ChevronLeft size={16} />
        </PageButton>
        <PageButton
          label="Trang sau"
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => onPageChange(pagination.page + 1)}
        >
          <ChevronRight size={16} />
        </PageButton>
      </div>
    </div>
  )
}

function PageButton({ children, label, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      {...props}
    >
      {children}
    </button>
  )
}
