import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import AdminButton from './AdminButton'

interface AdminModalProps {
  open: boolean
  title: string
  description?: string
  children: ReactNode
  confirmText: string
  onClose: () => void
  onConfirm: () => void
  size?: 'md' | 'lg' | 'xl'
  confirmTone?: 'primary' | 'danger'
  confirmDisabled?: boolean
}

export default function AdminModal({
  open,
  title,
  description,
  children,
  confirmText,
  onClose,
  onConfirm,
  size = 'lg',
  confirmTone = 'primary',
  confirmDisabled = false,
}: AdminModalProps) {
  if (!open) return null

  const widthClassName = {
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
  }[size]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
      <div className={`flex max-h-[90vh] w-full ${widthClassName} flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl`}>
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-base font-semibold text-gray-950">{title}</h2>
            {description && (
              <p className="mt-1 text-[13px] leading-[19px] text-slate-500">{description}</p>
            )}
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

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-100 bg-white px-6 py-4">
          <AdminButton tone="secondary" onClick={onClose}>Hủy</AdminButton>
          <AdminButton tone={confirmTone} disabled={confirmDisabled} onClick={onConfirm}>{confirmText}</AdminButton>
        </div>
      </div>
    </div>
  )
}
