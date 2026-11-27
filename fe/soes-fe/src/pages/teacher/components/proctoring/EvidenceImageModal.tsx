import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { apiClient } from '../../../../api/axios'
import { protectedEvidencePath } from '../../../../api/evidence'

function EvidenceImage({ imageUrl, title, onRetry }: { imageUrl: string; title: string; onRetry: () => void }) {
  const path = protectedEvidencePath(imageUrl)
  const [source, setSource] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (!path) return
    const controller = new AbortController()
    let objectUrl: string | null = null
    void apiClient.get<Blob>(path, { responseType: 'blob', signal: controller.signal }).then(({ data }) => {
      if (controller.signal.aborted) return
      if (!data.type.startsWith('image/')) throw new Error('Invalid evidence image')
      objectUrl = URL.createObjectURL(data)
      setSource(objectUrl)
    }).catch(() => { if (!controller.signal.aborted) setFailed(true) })
    return () => {
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [path])
  if (failed) return <div role="alert" className="space-y-3 text-center text-sm text-slate-200">
    <p>Không tải được ảnh bằng chứng. Vui lòng thử lại hoặc làm mới danh sách vi phạm.</p>
    <button type="button" onClick={onRetry} className="rounded-lg bg-white px-4 py-2 font-semibold text-blue-700">Thử lại</button>
  </div>
  const src = path ? source : imageUrl
  return src ? <img src={src} alt={title} onError={() => setFailed(true)}
    className="mx-auto max-h-[75vh] w-auto max-w-full rounded-lg object-contain shadow-md" />
    : <p role="status" className="text-sm text-slate-200">Đang tải ảnh bằng chứng...</p>
}

export interface EvidenceImageModalProps {
  imageUrl: string | null
  onClose: () => void
  title?: string
  description?: string
}

export default function EvidenceImageModal({
  imageUrl,
  onClose,
  title = 'Ảnh bằng chứng vi phạm',
  description,
}: EvidenceImageModalProps) {
  const [retry, setRetry] = useState(0)
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
          <div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
          </div>
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
          <EvidenceImage key={`${imageUrl}:${retry}`} imageUrl={imageUrl} title={title} onRetry={() => setRetry(value => value + 1)} />
        </div>
      </div>
    </div>
  )
}
