import { CheckCircle2, Code2, FileText, XCircle } from 'lucide-react'
import type { AttemptResult, AttemptReviewItem } from '../../api/student-take-exam.api'

function optionTone(item: AttemptReviewItem, optionId: string, isCorrect?: boolean) {
  const selected = item.selectedOptionIds?.includes(optionId) ?? false
  if (isCorrect) return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  if (selected) return 'border-blue-200 bg-blue-50 text-blue-800'
  return 'border-gray-100 bg-gray-50 text-gray-600'
}

function statusIcon(isCorrect: boolean | null) {
  if (isCorrect === true) return <CheckCircle2 size={16} className="text-emerald-600" />
  if (isCorrect === false) return <XCircle size={16} className="text-rose-500" />
  return <FileText size={16} className="text-gray-400" />
}

function ReviewQuestion({ item, showAnswerKey }: { item: AttemptReviewItem; showAnswerKey: boolean }) {
  const isProgramming = item.type === 'PROGRAMMING'

  return (
    <article className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            {statusIcon(item.isCorrect)}
            <span>Cau {item.orderIndex}</span>
            <span>{item.points} diem</span>
            {item.score !== null && <span>Dat {item.score} diem</span>}
          </div>
          <p className="whitespace-pre-wrap text-sm leading-6 text-gray-900">{item.content}</p>
        </div>
      </div>

      {isProgramming ? (
        <div className="mt-4 rounded-lg border border-gray-100 bg-gray-950 p-4 text-xs text-gray-100">
          <div className="mb-2 flex items-center gap-2 font-semibold text-gray-300">
            <Code2 size={14} />
            Ma nguon da nop
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap font-mono leading-5">
            {item.draftSourceCode?.trim() || 'Chua nop ma nguon.'}
          </pre>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {(item.options ?? []).map((option) => {
            const selected = item.selectedOptionIds?.includes(option.id) ?? false
            return (
              <div
                key={option.id}
                className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-sm ${optionTone(item, option.id, option.isCorrect)}`}
              >
                <span>{option.content}</span>
                <span className="shrink-0 text-xs font-semibold">
                  {option.isCorrect ? 'Dap an dung' : selected ? 'Da chon' : ''}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {showAnswerKey && item.explanation && (
        <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
          {item.explanation}
        </div>
      )}
    </article>
  )
}

export default function ExamReviewPanel({ result }: { result: AttemptResult }) {
  if (!result.available) return null

  if (result.reviewPolicy === 'NONE' || result.reviewPolicy === 'SCORE_ONLY') {
    return (
      <div className="rounded-lg border border-gray-100 bg-white p-4 text-sm text-gray-600">
        {result.reviewPolicy === 'SCORE_ONLY'
          ? 'Ca thi chi cho phep xem diem tong.'
          : 'Ca thi khong cho phep xem lai bai lam.'}
      </div>
    )
  }

  const showAnswerKey = result.reviewPolicy === 'FULL_AFTER_RELEASE'

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900">Xem lai bai lam</h2>
        <span className="text-xs font-semibold text-gray-500">
          {showAnswerKey ? 'Hien dap an dung va giai thich' : 'Khong hien dap an dung'}
        </span>
      </div>

      {result.reviewItems.length === 0 ? (
        <div className="rounded-lg border border-gray-100 bg-white p-4 text-sm text-gray-500">
          Chua co du lieu bai lam de hien thi.
        </div>
      ) : (
        <div className="space-y-3">
          {result.reviewItems.map((item) => (
            <ReviewQuestion key={item.questionId} item={item} showAnswerKey={showAnswerKey} />
          ))}
        </div>
      )}
    </section>
  )
}
