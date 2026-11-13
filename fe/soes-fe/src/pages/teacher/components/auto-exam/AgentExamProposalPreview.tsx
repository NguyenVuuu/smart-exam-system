import { CheckCircle2, FileCheck2, ListChecks } from 'lucide-react'
import type { AgentExamDraft } from '../../api/teacher-ai-exam.api'

const difficultyLabels = { EASY: 'Dễ', MEDIUM: 'Trung bình', HARD: 'Khó' }
const typeLabels: Record<string, string> = {
  SINGLE_CHOICE: '1 đáp án', MULTIPLE_CHOICE: 'Nhiều đáp án',
  TRUE_FALSE: 'Đúng / Sai', PROGRAMMING: 'Lập trình',
}

export default function AgentExamProposalPreview({ proposal, targetTotalPoints, isSaving, isSaved, onSaveDraft }: {
  proposal: AgentExamDraft
  targetTotalPoints: number
  isSaving: boolean
  isSaved: boolean
  onSaveDraft: () => void
}) {
  return <div className="mt-5 overflow-hidden rounded-2xl border border-blue-200 bg-white">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
      <div>
        <h3 className="flex items-center gap-2 font-semibold text-slate-900"><ListChecks size={18} className="text-blue-600" /> Xem trước đề AI đề xuất</h3>
        <p className="mt-1 text-sm text-slate-600">{proposal.rationale}</p>
      </div>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isSaved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
        {isSaved ? 'Đã lưu nháp' : 'Chưa lưu'}
      </span>
    </div>

    <div className="grid gap-2 border-b border-slate-100 px-4 py-4 text-sm sm:grid-cols-2 lg:grid-cols-4 sm:px-5">
      <Summary label="Số câu" value={`${proposal.questionIds.length} câu`} />
      <Summary label="Tổng điểm mục tiêu" value={`${targetTotalPoints} điểm`} />
      <Summary label="Dễ / Trung bình / Khó" value={`${proposal.difficultyMatrix.easy} / ${proposal.difficultyMatrix.medium} / ${proposal.difficultyMatrix.hard}`} />
      <Summary label="Chủ đề" value={`${proposal.topicMatrix.length} chủ đề`} />
    </div>

    <div className="px-4 py-4 sm:px-5">
      <p className="text-sm font-semibold text-slate-800">Phân bố chủ đề</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {proposal.topicMatrix.length ? proposal.topicMatrix.map((topic) =>
          <span key={topic.id} className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{topic.name}: {topic.count} câu</span>
        ) : <span className="text-sm text-slate-500">Chưa có câu được gắn chủ đề</span>}
        {proposal.unlabeledCount > 0 && <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
          Chưa gắn chủ đề: {proposal.unlabeledCount} câu
        </span>}
      </div>

      <ol className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
        {proposal.questions.map((question, index) => <li key={question.id} className="flex gap-3 rounded-xl border border-slate-200 p-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-700">{index + 1}</span>
          <div className="min-w-0">
            <p className="text-sm font-medium leading-6 text-slate-900">{question.title}</p>
            <p className="mt-1 text-xs text-slate-500">
              {typeLabels[question.type] ?? question.type} · {difficultyLabels[question.difficulty]} · {question.topics.join(', ') || 'Chưa gắn chủ đề'}
            </p>
          </div>
        </li>)}
      </ol>
    </div>

    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-4 py-4 sm:px-5">
      <p className="text-xs text-slate-600">Lưu nháp để xem đầy đủ câu hỏi, đáp án và tạo ca thi.</p>
      <button type="button" onClick={onSaveDraft} disabled={isSaving || isSaved}
        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300">
        {isSaved ? <CheckCircle2 size={17} /> : <FileCheck2 size={17} />}
        {isSaved ? 'Đã lưu đề nháp' : isSaving ? 'Đang lưu đề...' : 'Lưu đề nháp'}
      </button>
    </div>
  </div>
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-slate-50 px-3 py-2">
    <p className="text-xs text-slate-500">{label}</p>
    <p className="mt-0.5 font-semibold text-slate-900">{value}</p>
  </div>
}
