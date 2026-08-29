import { CheckCircle2, List, X } from 'lucide-react'
import type {
  QuestionAnswer,
  TakeExamQuestion,
} from '../../types/take-exam.types'
import { getQuestionStatus, hasAnswer } from './take-exam.utils'

interface QuestionNavigatorProps {
  questions: TakeExamQuestion[]
  currentQuestionId: string
  answers: Record<string, QuestionAnswer | undefined>
  flaggedQuestionIds: string[]
  isOpen: boolean
  onToggleOpen: () => void
  onSelect: (questionId: string) => void
}

interface QuestionGridProps {
  questions: TakeExamQuestion[]
  currentQuestionId: string
  answers: Record<string, QuestionAnswer | undefined>
  flaggedQuestionIds: string[]
  onSelect: (questionId: string) => void
}

function QuestionGrid({
  questions,
  currentQuestionId,
  answers,
  flaggedQuestionIds,
  onSelect,
}: QuestionGridProps) {
  return (
    <div className="grid grid-cols-4 gap-2" aria-label="Danh sách câu hỏi">
      {questions.map((question) => {
        const status = getQuestionStatus(question, currentQuestionId, answers)
        const isFlagged = flaggedQuestionIds.includes(question.id)
        const isAnswered = hasAnswer(answers[question.id])
        const classes = [
          'take-exam-question-button',
          status === 'current' ? 'take-exam-question-button--current' : '',
          status === 'answered' ? 'take-exam-question-button--answered' : '',
          isFlagged ? 'take-exam-question-button--flagged' : '',
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <button
            key={question.id}
          type="button"
          onClick={() => onSelect(question.id)}
          aria-label={`Câu ${question.orderIndex}${isAnswered ? ', đã trả lời' : ', chưa trả lời'}${isFlagged ? ', đánh dấu xem lại' : ''}`}
          aria-current={status === 'current' ? 'step' : undefined}
          className={classes}
        >
            <span>{question.orderIndex}</span>
            {isFlagged && <i aria-hidden="true" />}
          </button>
        )
      })}
    </div>
  )
}

function NavigatorLegend() {
  return (
    <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-2 text-[11px] text-slate-500">
      <span className="flex items-center gap-2">
        <span className="take-exam-legend-dot take-exam-legend-dot--current" aria-hidden="true" />
        Đang xem
      </span>
      <span className="flex items-center gap-2">
        <span className="take-exam-legend-dot take-exam-legend-dot--answered" aria-hidden="true" />
        Đã trả lời
      </span>
      <span className="flex items-center gap-2">
        <span className="take-exam-legend-dot take-exam-legend-dot--empty" aria-hidden="true" />
        Chưa trả lời
      </span>
      <span className="flex items-center gap-2">
        <span className="take-exam-legend-dot take-exam-legend-dot--flagged" aria-hidden="true" />
        Xem lại
      </span>
    </div>
  )
}

export default function QuestionNavigator({
  questions,
  currentQuestionId,
  answers,
  flaggedQuestionIds,
  isOpen,
  onToggleOpen,
  onSelect,
}: QuestionNavigatorProps) {
  const answeredCount = questions.filter((question) => hasAnswer(answers[question.id])).length

  return (
    <>
      <div className="lg:hidden">
        <button
          type="button"
          onClick={onToggleOpen}
          aria-expanded={isOpen}
          aria-controls="take-exam-mobile-question-list"
          className="flex min-h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-xs transition-colors hover:border-blue-200 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          <span className="flex items-center gap-2">
            <List size={17} className="text-blue-600" aria-hidden="true" />
            Chọn câu hỏi
          </span>
          <span className="text-xs font-medium text-slate-400">
            {answeredCount}/{questions.length} đã trả lời
          </span>
        </button>

        {isOpen && (
          <div
            id="take-exam-mobile-question-list"
            className="take-exam-mobile-navigator mt-2 rounded-xl border border-slate-100 bg-white p-4 shadow-lg"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Danh sách câu hỏi</h2>
                <p className="mt-1 text-xs text-slate-400">Chọn câu để chuyển nhanh</p>
              </div>
              <button
                type="button"
                onClick={onToggleOpen}
                aria-label="Đóng danh sách câu hỏi"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <X size={17} aria-hidden="true" />
              </button>
            </div>
            <QuestionGrid
              questions={questions}
              currentQuestionId={currentQuestionId}
              answers={answers}
              flaggedQuestionIds={flaggedQuestionIds}
              onSelect={(questionId) => {
                onSelect(questionId)
                onToggleOpen()
              }}
            />
            <NavigatorLegend />
          </div>
        )}
      </div>

      <aside className="take-exam-navigator hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:block">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Danh sách câu hỏi</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Chọn câu để chuyển nhanh giữa các phần.
            </p>
          </div>
          <CheckCircle2 size={18} className="text-emerald-500" aria-hidden="true" />
        </div>
        <div className="mt-5">
          <QuestionGrid
            questions={questions}
            currentQuestionId={currentQuestionId}
            answers={answers}
            flaggedQuestionIds={flaggedQuestionIds}
            onSelect={onSelect}
          />
        </div>
        <NavigatorLegend />
        <div className="mt-5 rounded-lg bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-500">
          <span className="font-semibold text-slate-700">Mẹo:</span> đánh dấu câu hỏi để quay lại xem trước khi nộp bài.
        </div>
      </aside>
    </>
  )
}
