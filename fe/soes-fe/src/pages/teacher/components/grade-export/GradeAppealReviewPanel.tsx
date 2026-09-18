import { Save, X } from 'lucide-react'
import type { TeacherGradeAppeal } from '../../api/teacher-exams.api'
import type { Exam, ExamSubmission } from '../../types/teacher-exam.types'
import SubmissionAnswerList from '../exam-detail/SubmissionAnswerList'

interface GradeAppealReviewPanelProps {
  appeal: TeacherGradeAppeal
  exam: Exam | null
  submission: ExamSubmission | null
  score: number
  reason: string
  loading: boolean
  saving: boolean
  onScoreChange: (score: number) => void
  onReasonChange: (reason: string) => void
  onClose: () => void
  onSave: () => void
}

export default function GradeAppealReviewPanel({
  appeal,
  exam,
  submission,
  score,
  reason,
  loading,
  saving,
  onScoreChange,
  onReasonChange,
  onClose,
  onSave,
}: GradeAppealReviewPanelProps) {
  const editable = appeal.status === 'PENDING' || appeal.status === 'IN_REVIEW'
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <ReviewHeader appeal={appeal} onClose={onClose} />
      {loading && <PanelMessage message="Đang tải bài nộp..." />}
      {!loading && (!exam || !submission) && <PanelMessage message="Không tìm thấy dữ liệu bài nộp để chấm lại." />}
      {!loading && exam && submission && (
        <div className="grid min-h-[560px] lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-h-0 border-b border-slate-100 lg:border-b-0 lg:border-r">
            <ScoreSummary appeal={appeal} submission={submission} />
            <SubmissionAnswerList exam={exam} submission={submission} />
          </div>
          <ReviewForm
            appeal={appeal}
            score={score}
            reason={reason}
            editable={editable}
            saving={saving}
            onScoreChange={onScoreChange}
            onReasonChange={onReasonChange}
            onSave={onSave}
          />
        </div>
      )}
    </section>
  )
}

function ReviewHeader({ appeal, onClose }: { appeal: TeacherGradeAppeal; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-slate-950">Xem bài và chấm phúc khảo</h2>
        <p className="mt-1 truncate text-xs text-slate-500">
          {appeal.student.fullName} · {appeal.student.studentCode} · {appeal.exam.title}
        </p>
      </div>
      <button type="button" onClick={onClose} title="Đóng" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
        <X size={17} />
      </button>
    </div>
  )
}

function ScoreSummary({ appeal, submission }: { appeal: TeacherGradeAppeal; submission: ExamSubmission }) {
  const stats = [
    { label: 'Điểm tự động', value: submission.autoScore === null ? '-' : `${submission.autoScore}đ` },
    { label: 'Điểm hiện tại', value: submission.finalScore === null ? '-' : `${submission.finalScore}đ` },
    { label: 'Điểm tối đa', value: `${appeal.exam.maxScore}đ` },
  ]
  return (
    <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/70 py-4">
      {stats.map((stat) => (
        <div key={stat.label} className="px-4">
          <span className="text-[11px] font-medium text-slate-500">{stat.label}</span>
          <p className="mt-1 text-sm font-semibold text-slate-950">{stat.value}</p>
        </div>
      ))}
    </div>
  )
}

function ReviewForm({
  appeal,
  score,
  reason,
  editable,
  saving,
  onScoreChange,
  onReasonChange,
  onSave,
}: {
  appeal: TeacherGradeAppeal
  score: number
  reason: string
  editable: boolean
  saving: boolean
  onScoreChange: (score: number) => void
  onReasonChange: (reason: string) => void
  onSave: () => void
}) {
  return (
    <div className="space-y-4 p-5">
      <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-900">
        <strong>Lý do sinh viên:</strong> {appeal.reason}
      </div>
      <Field label="Điểm sau phúc khảo">
        <input
          type="number"
          min="0"
          max={appeal.exam.maxScore}
          step="0.1"
          value={score}
          onChange={(event) => onScoreChange(Number(event.target.value))}
          disabled={!editable}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-blue-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </Field>
      <Field label="Kết luận chấm lại">
        <textarea
          rows={5}
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          disabled={!editable}
          className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          placeholder="Nêu kết quả kiểm tra và lý do điều chỉnh điểm..."
        />
      </Field>
      {editable ? (
        <button type="button" onClick={onSave} disabled={saving} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
          <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu kết quả phúc khảo'}
        </button>
      ) : (
        <p className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700">
          Yêu cầu này đã hoàn tất và được lưu trong lịch sử.
        </p>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  )
}

function PanelMessage({ message }: { message: string }) {
  return <div className="px-5 py-12 text-center text-sm text-slate-400">{message}</div>
}
