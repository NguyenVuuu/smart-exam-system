import { Eye, MessageSquareWarning, SearchX } from 'lucide-react'
import AppBadge from '../../../../components/common/AppBadge'
import AppSelect from '../../../../components/common/AppSelect'
import type { TeacherGradeAppeal, TeacherPaginationMeta } from '../../api/teacher-exams.api'
import type { GradeAppealStatus } from '../../hooks/useTeacherGradeAppeals'
import TeacherPagination from '../TeacherPagination'

interface GradeAppealsPanelProps {
  appeals: TeacherGradeAppeal[]
  pagination: TeacherPaginationMeta
  status: GradeAppealStatus
  replies: Record<string, string>
  loading: boolean
  onStatusChange: (status: GradeAppealStatus) => void
  onPageChange: (page: number) => void
  onReplyChange: (appealId: string, reply: string) => void
  onOpenSubmission: (appeal: TeacherGradeAppeal) => void
  onUpdateAppeal: (appealId: string, status: 'IN_REVIEW' | 'REJECTED') => void
}

const STATUS_LABELS: Record<TeacherGradeAppeal['status'], string> = {
  PENDING: 'Chờ xử lý',
  IN_REVIEW: 'Đang xem xét',
  RESOLVED: 'Đã xử lý',
  REJECTED: 'Đã từ chối',
}

const STATUS_TONES: Record<TeacherGradeAppeal['status'], 'blue' | 'amber' | 'emerald' | 'rose'> = {
  PENDING: 'blue',
  IN_REVIEW: 'amber',
  RESOLVED: 'emerald',
  REJECTED: 'rose',
}

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'PENDING', label: 'Chờ xử lý' },
  { value: 'IN_REVIEW', label: 'Đang xem xét' },
  { value: 'RESOLVED', label: 'Đã xử lý' },
  { value: 'REJECTED', label: 'Đã từ chối' },
]

function isOpenAppeal(status: TeacherGradeAppeal['status']) {
  return status === 'PENDING' || status === 'IN_REVIEW'
}

export default function GradeAppealsPanel({
  appeals,
  pagination,
  status,
  replies,
  loading,
  onStatusChange,
  onPageChange,
  onReplyChange,
  onOpenSubmission,
  onUpdateAppeal,
}: GradeAppealsPanelProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-950">Yêu cầu phúc khảo</h2>
          <p className="mt-1 text-xs text-slate-500">Theo dõi yêu cầu, mở bài nộp và lưu kết luận chấm lại.</p>
        </div>
        <AppSelect
          value={status}
          onChange={(nextStatus) => onStatusChange(nextStatus as GradeAppealStatus)}
          options={STATUS_OPTIONS}
          className="w-full md:w-52"
          buttonClassName="bg-white"
        />
      </div>

      {loading ? (
        <AppealLoadingState />
      ) : appeals.length === 0 ? (
        <div className="flex flex-col items-center px-5 py-14 text-center text-slate-400">
          <SearchX size={26} />
          <p className="mt-3 text-sm font-medium">Không có yêu cầu phúc khảo phù hợp.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {appeals.map((appeal) => (
            <AppealRow
              key={appeal.id}
              appeal={appeal}
              reply={replies[appeal.id] ?? ''}
              onReplyChange={onReplyChange}
              onOpenSubmission={onOpenSubmission}
              onUpdateAppeal={onUpdateAppeal}
            />
          ))}
        </div>
      )}

      {!loading && pagination.totalItems > 0 && (
        <TeacherPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          onChange={onPageChange}
        />
      )}
    </section>
  )
}

function AppealRow({
  appeal,
  reply,
  onReplyChange,
  onOpenSubmission,
  onUpdateAppeal,
}: {
  appeal: TeacherGradeAppeal
  reply: string
  onReplyChange: (appealId: string, reply: string) => void
  onOpenSubmission: (appeal: TeacherGradeAppeal) => void
  onUpdateAppeal: (appealId: string, status: 'IN_REVIEW' | 'REJECTED') => void
}) {
  const open = isOpenAppeal(appeal.status)
  return (
    <article className="grid gap-5 px-5 py-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-slate-950">{appeal.student.fullName}</h3>
          <span className="whitespace-nowrap text-xs font-medium text-blue-700">{appeal.student.studentCode}</span>
          <AppBadge tone={STATUS_TONES[appeal.status]}>{STATUS_LABELS[appeal.status]}</AppBadge>
        </div>
        <p className="mt-1 truncate text-xs text-slate-500">{appeal.exam.title} · {appeal.exam.scheduleTitle}</p>
        <div className="mt-3 rounded-lg bg-slate-50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase text-slate-500">Lý do của sinh viên</p>
          <p className="mt-1 text-sm leading-6 text-slate-700">{appeal.reason}</p>
        </div>
        {appeal.teacherReply && (
          <p className="mt-3 text-sm text-slate-600"><strong>Kết luận:</strong> {appeal.teacherReply}</p>
        )}
      </div>

      <div className="flex min-w-0 flex-col justify-center gap-2">
        {open && (
          <textarea
            value={reply}
            onChange={(event) => onReplyChange(appeal.id, event.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            placeholder="Phản hồi khi cần từ chối hoặc cập nhật trạng thái..."
          />
        )}
        <div className="flex flex-wrap justify-end gap-2">
          {appeal.status === 'PENDING' && (
            <button type="button" onClick={() => onUpdateAppeal(appeal.id, 'IN_REVIEW')} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
              Đánh dấu đang xem
            </button>
          )}
          {open && (
            <>
              <button type="button" onClick={() => onUpdateAppeal(appeal.id, 'REJECTED')} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                Từ chối
              </button>
              <button type="button" onClick={() => onOpenSubmission(appeal)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">
                <Eye size={15} /> Xem bài và chấm lại
              </button>
            </>
          )}
          {!open && (
            <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
              <MessageSquareWarning size={15} /> Đã lưu trong lịch sử phúc khảo
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

function AppealLoadingState() {
  return (
    <div className="space-y-1 p-5" aria-label="Đang tải yêu cầu phúc khảo">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="h-28 animate-pulse rounded-lg bg-slate-100" />
      ))}
    </div>
  )
}
