import { Save } from 'lucide-react'
import type { TeacherGradeAppeal } from '../../api/teacher-exams.api'
import type { Exam, ExamSubmission } from '../../types/teacher-exam.types'
import SubmissionAnswerList from '../exam-detail/SubmissionAnswerList'

interface GradeAppealReviewPanelProps {
  appeal: TeacherGradeAppeal
  exam: Exam
  submission: ExamSubmission
  score: number
  conclusion: string
  saving: boolean
  onScoreChange: (score: number) => void
  onConclusionChange: (conclusion: string) => void
  onSave: () => void
}

export default function GradeAppealReviewPanel({
  appeal,
  exam,
  submission,
  score,
  conclusion,
  saving,
  onScoreChange,
  onConclusionChange,
  onSave,
}: GradeAppealReviewPanelProps) {
  const editable = appeal.status === 'PENDING' || appeal.status === 'IN_REVIEW'
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="grid min-h-[620px] lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-h-0 border-b border-slate-100 lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-950">Bài làm đã nộp</h2>
            <p className="mt-1 text-xs text-slate-500">Đối chiếu đáp án, điểm từng câu và kết quả chấm tự động.</p>
          </div>
          <ScoreSummary appeal={appeal} submission={submission} />
          <SubmissionAnswerList exam={exam} submission={submission} />
        </div>
        <ReviewForm
          appeal={appeal}
          score={score}
          conclusion={conclusion}
          editable={editable}
          saving={saving}
          onScoreChange={onScoreChange}
          onConclusionChange={onConclusionChange}
          onSave={onSave}
        />
      </div>
    </section>
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
  conclusion,
  editable,
  saving,
  onScoreChange,
  onConclusionChange,
  onSave,
}: {
  appeal: TeacherGradeAppeal
  score: number
  conclusion: string
  editable: boolean
  saving: boolean
  onScoreChange: (score: number) => void
  onConclusionChange: (conclusion: string) => void
  onSave: () => void
}) {
  return (
    <aside className="space-y-4 bg-slate-50/50 p-5 lg:sticky lg:top-0 lg:self-start">
      <div>
        <h2 className="text-sm font-semibold text-slate-950">Kết luận phúc khảo</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">Ghi nhận điểm chính thức và phản hồi gửi đến sinh viên.</p>
      </div>
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
          value={conclusion}
          onChange={(event) => onConclusionChange(event.target.value)}
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
    </aside>
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
