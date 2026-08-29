import { AlertTriangle, CheckCircle2, X } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface ExamSubmitDialogProps {
  isOpen: boolean
  unansweredCount: number
  onCancel: () => void
  onConfirm: () => void
  isSubmitting: boolean
}

export default function ExamSubmitDialog({
  isOpen,
  unansweredCount,
  onCancel,
  onConfirm,
  isSubmitting,
}: ExamSubmitDialogProps) {
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    titleRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSubmitting) onCancel()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, isSubmitting, onCancel])

  if (!isOpen) return null

  const hasUnanswered = unansweredCount > 0

  return (
    <div
      className="take-exam-dialog-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onCancel()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="submit-dialog-title"
        aria-describedby="submit-dialog-description"
        className="take-exam-dialog w-full max-w-md rounded-2xl border border-slate-100 bg-white p-5 shadow-xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            {hasUnanswered ? <AlertTriangle size={21} aria-hidden="true" /> : <CheckCircle2 size={21} aria-hidden="true" />}
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label="Đóng xác nhận nộp bài"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <h2
          id="submit-dialog-title"
          ref={titleRef}
          tabIndex={-1}
          className="mt-5 text-lg font-bold tracking-tight text-slate-900 outline-none"
        >
          Xác nhận nộp bài
        </h2>
        <p id="submit-dialog-description" className="mt-2 text-sm leading-relaxed text-slate-500">
          {hasUnanswered
            ? `Bạn còn ${unansweredCount} câu hỏi chưa trả lời. Bạn có chắc chắn muốn nộp bài không?`
            : 'Bạn có chắc chắn muốn nộp bài không? Sau khi nộp, bạn không thể chỉnh sửa câu trả lời.'}
        </p>

        <div className={`mt-4 rounded-xl border px-4 py-3 text-xs leading-relaxed ${hasUnanswered ? 'border-amber-100 bg-amber-50/70 text-amber-800' : 'border-emerald-100 bg-emerald-50/70 text-emerald-800'}`}>
          {hasUnanswered
            ? 'Bạn vẫn có thể chọn Hủy để quay lại và hoàn thiện bài làm.'
            : 'Tất cả câu hỏi đã có câu trả lời. Kiểm tra lần cuối trước khi xác nhận.'}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="min-h-11 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="min-h-11 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting ? 'Đang nộp bài...' : 'Xác nhận nộp bài'}
          </button>
        </div>
      </section>
    </div>
  )
}
