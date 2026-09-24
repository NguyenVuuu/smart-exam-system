import { Clock, RefreshCw } from 'lucide-react'

export default function StudentExamState({
  text,
  onRetry,
}: {
  text: string
  onRetry?: () => void
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-6 py-12 text-center text-sm text-slate-500">
      <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
        <Clock size={24} />
      </span>
      <span>{text}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-blue-600 hover:bg-blue-50"
        >
          <RefreshCw size={15} /> Thử lại
        </button>
      )}
    </div>
  )
}
