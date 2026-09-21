import { X } from 'lucide-react'

export interface EvidenceImageModalProps {
  imageUrl: string | null
  onClose: () => void
  title?: string
}

export default function EvidenceImageModal({
  imageUrl,
  onClose,
  title = 'Ảnh bằng chứng vi phạm',
}: EvidenceImageModalProps) {
  if (!imageUrl) return null

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-black/70 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>
        <div className="bg-slate-950 p-4 flex items-center justify-center min-h-[300px]">
          <img
            src={imageUrl}
            alt={title}
            className="mx-auto max-h-[75vh] w-auto max-w-full rounded-lg object-contain shadow-md"
          />
        </div>
      </div>
    </div>
  )
}
