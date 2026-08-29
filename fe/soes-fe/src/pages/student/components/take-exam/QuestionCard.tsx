import { Flag } from 'lucide-react'
import type {
  QuestionAnswer,
  TakeExamQuestion,
} from '../../types/take-exam.types'
import type { RunCodeResponse } from '../../api/student-take-exam.api'
import ChoiceQuestion from './ChoiceQuestion'
import CodeQuestion from './CodeQuestion'
import { getQuestionTypeLabel } from './take-exam.utils'

interface QuestionCardProps {
  question: TakeExamQuestion
  questionIndex: number
  totalQuestions: number
  answer: QuestionAnswer | undefined
  onAnswerChange: (answer: QuestionAnswer) => void
  isFlagged: boolean
  onToggleFlag: () => void
  onRunCode: (sourceCode: string) => void
  isRunningCode: boolean
  runCodeResult: RunCodeResponse | null
  runCodeError: string | null
  blockRightClick: boolean
}

export default function QuestionCard({
  question,
  questionIndex,
  totalQuestions,
  answer,
  onAnswerChange,
  isFlagged,
  onToggleFlag,
  onRunCode,
  isRunningCode,
  runCodeResult,
  runCodeError,
  blockRightClick,
}: QuestionCardProps) {
  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.08em] text-blue-600">
              Câu {questionIndex + 1}/{totalQuestions}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
              {getQuestionTypeLabel(question.type)}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">{question.points} điểm</p>
        </div>
        <button
          type="button"
          onClick={onToggleFlag}
          aria-pressed={isFlagged}
          className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400/30 ${
            isFlagged
              ? 'border-amber-200 bg-amber-50 text-amber-700'
              : 'border-slate-200 bg-white text-slate-500 hover:border-amber-200 hover:bg-amber-50/60 hover:text-amber-700'
          }`}
        >
          <Flag size={15} fill={isFlagged ? 'currentColor' : 'none'} aria-hidden="true" />
          <span>{isFlagged ? 'Bỏ đánh dấu' : 'Đánh dấu xem lại'}</span>
        </button>
      </div>

      <h2 className="mt-6 max-w-3xl text-base font-semibold leading-relaxed text-slate-900 sm:text-lg">
        {question.content}
      </h2>

      <div className="mt-6">
        {question.type === 'CODING' ? (
          <CodeQuestion
            question={question}
            value={answer}
            onChange={onAnswerChange}
            onRun={onRunCode}
            isRunning={isRunningCode}
            runResult={runCodeResult}
            runError={runCodeError}
            blockRightClick={blockRightClick}
          />
        ) : (
          <ChoiceQuestion
            question={question}
            value={answer}
            onChange={onAnswerChange}
          />
        )}
      </div>
    </article>
  )
}
