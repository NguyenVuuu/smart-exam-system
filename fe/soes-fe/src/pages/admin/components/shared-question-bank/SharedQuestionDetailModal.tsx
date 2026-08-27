import { X } from 'lucide-react'
import AppBadge from '../../../../components/common/AppBadge'
import type { AdminSubject, SharedQuestionAdmin } from '../../types/admin.types'
import { QuestionStatusBadge } from '../AdminBadges'
import AdminButton from '../AdminButton'

const typeLabel: Record<SharedQuestionAdmin['type'], string> = {
  SINGLE_CHOICE: 'Một đáp án',
  MULTIPLE_CHOICE: 'Nhiều đáp án',
  TRUE_FALSE: 'Đúng / Sai',
  PROGRAMMING: 'Lập trình',
}

const difficultyTone = {
  EASY: 'emerald',
  MEDIUM: 'amber',
  HARD: 'rose',
} as const

const difficultyLabel: Record<SharedQuestionAdmin['difficulty'], string> = {
  EASY: 'Dễ',
  MEDIUM: 'Trung bình',
  HARD: 'Khó',
}

const questionDetails: Record<
  string,
  {
    options?: Array<{ label: string; content: string; correct?: boolean }>
    explanation: string
    extra?: string
  }
> = {
  'sq-1': {
    options: [
      { label: 'A', content: 'new ClassName()', correct: true },
      { label: 'B', content: 'ClassName obj = new ClassName()', correct: true },
      { label: 'C', content: 'ClassName()' },
      { label: 'D', content: 'Class.forName(...).newInstance()', correct: true },
    ],
    explanation: 'Khởi tạo đối tượng cần từ khóa new hoặc sử dụng reflection.',
  },
  'sq-2': {
    explanation: 'Bài lập trình kiểm tra số nguyên tố bằng cách thử ước từ 2 đến căn bậc hai của n.',
    extra: 'Java • 3 test case • Time limit 1000ms • Memory 128MB',
  },
  'sq-3': {
    options: [
      { label: 'A', content: 'Đúng', correct: true },
      { label: 'B', content: 'Sai' },
    ],
    explanation: 'Trong Java, kiểu int là số nguyên 32 bit có dấu.',
  },
}

export default function SharedQuestionDetailModal({
  question,
  subjectsByCode,
  onClose,
}: {
  question: SharedQuestionAdmin | null
  subjectsByCode: Map<string, AdminSubject>
  onClose: () => void
}) {
  if (!question) return null

  const detail = questionDetails[question.id]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[82vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Chi tiết câu hỏi ngân hàng chung</h2>
            <p className="mt-1 text-[13px] leading-[19px] text-slate-500">
              {subjectsByCode.get(question.subjectCode)?.name ?? question.subjectCode} • Giảng viên đóng góp: {question.contributorName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-gray-100 hover:text-slate-700"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <AppBadge tone="blue">{typeLabel[question.type]}</AppBadge>
            <AppBadge tone={difficultyTone[question.difficulty]}>{difficultyLabel[question.difficulty]}</AppBadge>
            <QuestionStatusBadge status={question.status} />
          </div>

          <div className="rounded-xl border border-gray-200 bg-slate-50/60 p-4">
            <p className="text-sm font-semibold text-slate-900 leading-relaxed">{question.content}</p>
          </div>

          {detail?.options && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Danh sách đáp án</p>
              <div className="space-y-2">
                {detail.options.map((opt) => (
                  <div
                    key={opt.label}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm ${
                      opt.correct
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-900 font-medium'
                        : 'border-gray-100 bg-white text-slate-700'
                    }`}
                  >
                    <span className="font-bold">{opt.label}.</span>
                    <span>{opt.content}</span>
                    {opt.correct && <span className="ml-auto text-xs font-semibold text-emerald-600">Đáp án đúng</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {detail?.extra && (
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-xs text-slate-600 font-mono">
              {detail.extra}
            </div>
          )}

          {detail?.explanation && (
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3.5 text-xs text-blue-900">
              <span className="font-semibold">Lời giải / Giải thích: </span>
              {detail.explanation}
            </div>
          )}

          {question.status === 'REMOVED' && question.removalReason && (
            <div className="rounded-xl bg-rose-50 border border-rose-100 p-3.5 text-xs text-rose-800">
              <span className="font-semibold">Lý do gỡ khỏi ngân hàng chung: </span>
              {question.removalReason}
              {question.removedBy && (
                <span className="block mt-1 text-rose-600">
                  Thực hiện bởi: {question.removedBy} ({question.removedAt})
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 justify-end border-t border-gray-100 bg-gray-50 px-6 py-4">
          <AdminButton tone="secondary" onClick={onClose}>
            Đóng
          </AdminButton>
        </div>
      </div>
    </div>
  )
}
