import { ArrowLeft, Clock, ShieldCheck } from 'lucide-react'
import examTrophy from '../../../../assets/student/take-exam/exam-trophy.svg'
import type { TakeExamSession } from '../../types/take-exam.types'
import { formatQuestionProgress, formatRemainingTime } from './take-exam.utils'

interface TakeExamHeaderProps {
  session: TakeExamSession
  secondsRemaining: number
  answeredCount: number
  totalQuestions: number
  onBack: () => void
}

export default function TakeExamHeader({
  session,
  secondsRemaining,
  answeredCount,
  totalQuestions,
  onBack,
}: TakeExamHeaderProps) {
  const isUrgent = secondsRemaining <= 5 * 60

  return (
    <section className="take-exam-hero rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-5 px-5 pb-5 pt-4 sm:px-7 sm:pb-6 sm:pt-5">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={onBack}
            className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-xs font-medium text-slate-500 transition-colors hover:bg-white/70 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Quay lại chi tiết bài thi</span>
          </button>

          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-sm shadow-blue-200/60">
              <img src={examTrophy} alt="" aria-hidden="true" className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <h1 className="max-w-3xl text-xl font-bold leading-tight tracking-tight text-slate-900 sm:text-2xl">
                {session.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">
                  Bài thi trực tuyến
                </span>
                <span>{session.questions.length} câu hỏi</span>
                <span className="text-slate-300" aria-hidden="true">
                  •
                </span>
                <span>{session.durationMinutes} phút</span>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`take-exam-timer flex min-w-[176px] items-center gap-3 rounded-xl border px-4 py-3 ${
            isUrgent ? 'take-exam-timer--urgent' : ''
          }`}
          role="status"
          aria-live="polite"
          aria-label={`Thời gian còn lại ${formatRemainingTime(secondsRemaining)}`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/80">
            <Clock size={18} aria-hidden="true" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em]">Thời gian còn lại</p>
            <p className="mt-0.5 font-mono text-xl font-bold tabular-nums tracking-tight">
              {formatRemainingTime(secondsRemaining)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/80 px-5 py-3.5 sm:px-7">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
          <ShieldCheck size={15} className="text-emerald-500" aria-hidden="true" />
          <span>Câu trả lời được lưu cục bộ trong phiên làm bài</span>
        </div>
        <span className="text-xs font-semibold text-slate-500">
          {formatQuestionProgress(answeredCount, totalQuestions)} đã hoàn thành
        </span>
      </div>
    </section>
  )
}
