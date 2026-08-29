import { CheckCircle2, Clock, Flag } from 'lucide-react'

interface TakeExamProgressProps {
  answeredCount: number
  totalQuestions: number
  flaggedCount: number
  secondsRemaining: number
}

function formatMinutes(seconds: number): string {
  return `${Math.ceil(Math.max(0, seconds) / 60)} phút`
}

export default function TakeExamProgress({
  answeredCount,
  totalQuestions,
  flaggedCount,
  secondsRemaining,
}: TakeExamProgressProps) {
  const unansweredCount = Math.max(totalQuestions - answeredCount, 0)
  const completion = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0

  return (
    <section className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xs">
      <div className="h-1 bg-slate-100" aria-hidden="true">
        <div
          className="h-full rounded-r-full bg-blue-600 transition-[width] duration-300"
          style={{ width: `${completion}%` }}
        />
      </div>
      <div className="grid grid-cols-2 divide-x divide-slate-100 sm:grid-cols-4">
        <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
          <CheckCircle2 size={17} className="shrink-0 text-emerald-500" aria-hidden="true" />
          <div>
            <p className="text-base font-bold leading-none text-slate-900">{answeredCount}</p>
            <p className="mt-1 text-[11px] text-slate-400">Đã trả lời</p>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-slate-100 px-4 py-3.5 sm:border-t-0 sm:px-5">
          <span className="flex h-[17px] w-[17px] items-center justify-center rounded-full border border-slate-300 text-[9px] font-bold text-slate-400" aria-hidden="true">
            ?
          </span>
          <div>
            <p className="text-base font-bold leading-none text-slate-900">{unansweredCount}</p>
            <p className="mt-1 text-[11px] text-slate-400">Chưa trả lời</p>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-slate-100 px-4 py-3.5 sm:border-t-0 sm:px-5">
          <Flag size={17} className="shrink-0 text-amber-500" aria-hidden="true" />
          <div>
            <p className="text-base font-bold leading-none text-slate-900">{flaggedCount}</p>
            <p className="mt-1 text-[11px] text-slate-400">Xem lại</p>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-slate-100 px-4 py-3.5 sm:border-t-0 sm:px-5">
          <Clock size={17} className="shrink-0 text-slate-400" aria-hidden="true" />
          <div>
            <p className="text-base font-bold leading-none text-slate-900">{formatMinutes(secondsRemaining)}</p>
            <p className="mt-1 text-[11px] text-slate-400">Dự kiến còn lại</p>
          </div>
        </div>
      </div>
    </section>
  )
}
