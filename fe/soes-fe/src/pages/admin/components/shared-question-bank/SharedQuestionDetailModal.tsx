import { X } from 'lucide-react'
import AppBadge from '../../../../components/common/AppBadge'
import type { AdminSubject, SharedQuestionAdmin } from '../../types/admin.types'
import { QuestionStatusBadge } from '../AdminBadges'
import AdminButton from '../AdminButton'

const typeLabel = {
  SINGLE_CHOICE: 'Một đáp án', MULTIPLE_CHOICE: 'Nhiều đáp án',
  TRUE_FALSE: 'Đúng / Sai', PROGRAMMING: 'Lập trình',
} as const
const difficultyLabel = { EASY: 'Dễ', MEDIUM: 'Trung bình', HARD: 'Khó' } as const
const difficultyTone = { EASY: 'emerald', MEDIUM: 'amber', HARD: 'rose' } as const

export default function SharedQuestionDetailModal({ question, subjectsByCode, onClose }: {
  question: SharedQuestionAdmin | null; subjectsByCode: Map<string, AdminSubject>; onClose: () => void
}) {
  if (!question) return null
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
    <div className="flex max-h-[82vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
      <header className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
        <div><h2 className="text-base font-semibold text-slate-950">Chi tiết câu hỏi ngân hàng chung</h2>
          <p className="mt-1 text-[13px] text-slate-500">{subjectsByCode.get(question.subjectCode)?.name ?? question.subjectCode} • Giảng viên đóng góp: {question.contributorName}</p></div>
        <button type="button" aria-label="Đóng" title="Đóng" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-gray-100"><X size={18} /></button>
      </header>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <div className="flex gap-2"><AppBadge tone="blue">{typeLabel[question.type]}</AppBadge>
          <AppBadge tone={difficultyTone[question.difficulty]}>{difficultyLabel[question.difficulty]}</AppBadge>
          <QuestionStatusBadge status={question.status} /></div>
        <p className="rounded-xl border border-gray-200 bg-slate-50/60 p-4 text-sm font-medium text-slate-900">{question.content}</p>
        {question.options?.length ? <div className="space-y-2">{question.options.map((option, index) =>
          <div key={option.id} className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm ${option.isCorrect ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-gray-100'}`}>
            <span className="font-medium">{String.fromCharCode(65 + index)}.</span><span>{option.content}</span>
            {option.isCorrect && <span className="ml-auto text-xs text-emerald-600">Đáp án đúng</span>}
          </div>)}</div> : null}
        {question.programmingConfig && <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">Thời gian {question.programmingConfig.timeLimitMs} ms • Bộ nhớ {question.programmingConfig.memoryLimitMb} MB • {question.testCases?.length ?? 0} test case</p>}
        {question.explanation && <p className="rounded-xl border border-blue-100 bg-blue-50 p-3.5 text-xs text-blue-900"><strong>Giải thích: </strong>{question.explanation}</p>}
        {question.removalReason && <p className="rounded-xl border border-rose-100 bg-rose-50 p-3.5 text-xs text-rose-800"><strong>Lý do gỡ: </strong>{question.removalReason}<span className="mt-1 block">{question.removedBy} • {question.removedAt}</span></p>}
      </div>
      <footer className="flex justify-end border-t border-gray-100 bg-gray-50 px-6 py-4"><AdminButton tone="secondary" onClick={onClose}>Đóng</AdminButton></footer>
    </div>
  </div>
}
