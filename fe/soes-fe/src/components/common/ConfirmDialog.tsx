import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: ReactNode
  confirmLabel: string
  icon?: ReactNode
  pending?: boolean
  tone?: 'primary' | 'danger'
  onClose: () => void
  onConfirm: () => void
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  icon,
  pending = false,
  tone = 'primary',
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  if (!open) return null

  const confirmClassName = tone === 'danger'
    ? 'bg-rose-600 hover:bg-rose-700'
    : 'bg-blue-600 hover:bg-blue-700'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-2.5">
            {icon}
            <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-gray-100 hover:text-slate-600 disabled:opacity-50 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 text-sm leading-6 text-slate-600">{description}</div>

        <div className="flex justify-end gap-2.5 border-t border-gray-100 bg-gray-50/70 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-gray-50 disabled:opacity-50 transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={`h-10 rounded-xl px-4 text-sm font-semibold text-white disabled:opacity-50 transition-colors cursor-pointer ${confirmClassName}`}
          >
            {pending ? 'Đang xử lý...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
