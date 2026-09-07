import { Copy, X } from 'lucide-react'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { formatDateTime } from '../../../../utils/date.utils'
import { getAuditActionLabel, getAuditEntityLabel, roleLabels } from '../../constants/audit-log.labels'
import type { AdminAuditLogDetailApiDto } from '../../types/admin-api.types'
import { getAuditClientLabel } from '../../utils/audit-client-label'

const DetailField = ({ label, content }: { label: string; content?: string | null }) => (
  <div>
    <dt className="text-xs font-semibold uppercase text-slate-400">{label}</dt>
    <dd className="mt-1 break-words text-sm text-slate-800">{content || '-'}</dd>
  </div>
)

export default function AuditLogDetailModal({ auditLog, loading, onClose }: {
  auditLog?: AdminAuditLogDetailApiDto
  loading: boolean
  onClose: () => void
}) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  const copyEntityId = async () => {
    if (!auditLog) return
    try {
      await navigator.clipboard.writeText(auditLog.entityId)
      toast.success('Đã sao chép ID đối tượng.')
    } catch {
      toast.error('Không thể sao chép ID đối tượng.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]" onMouseDown={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="audit-log-detail-title" className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div><h2 id="audit-log-detail-title" className="text-base font-semibold text-slate-950">Chi tiết nhật ký hệ thống</h2><p className="mt-1 text-sm text-slate-500">Bản ghi chỉ đọc, không thể chỉnh sửa hoặc xóa.</p></div>
          <button type="button" onClick={onClose} title="Đóng" className="rounded-lg p-2 text-slate-400 hover:bg-gray-100 hover:text-slate-700"><X size={18} /></button>
        </header>

        <div className="overflow-y-auto px-6 py-5">
          {loading || !auditLog ? <div className="h-64 animate-pulse rounded-lg bg-gray-50" /> : (
            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <DetailField label="Thời gian" content={formatDateTime(auditLog.createdAt)} />
              <DetailField label="Hành động" content={getAuditActionLabel(auditLog.action)} />
              <DetailField label="Người thực hiện" content={`${auditLog.actor.fullName}${auditLog.actor.code ? ` (${auditLog.actor.code})` : ''}`} />
              <DetailField label="Vai trò" content={roleLabels[auditLog.actor.role]} />
              <DetailField label="Email" content={auditLog.actor.email} />
              <DetailField label="Địa chỉ IP" content={auditLog.ipAddress} />
              <DetailField label="Loại đối tượng" content={getAuditEntityLabel(auditLog.entityType)} />
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-400">ID đối tượng</dt>
                <dd className="mt-1 flex items-center gap-2 text-sm text-slate-800"><span className="min-w-0 break-all">{auditLog.entityId}</span><button type="button" onClick={() => void copyEntityId()} title="Sao chép ID" className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-gray-100 hover:text-slate-700"><Copy size={15} /></button></dd>
              </div>
              <div className="sm:col-span-2"><DetailField label="Thiết bị / Trình duyệt" content={getAuditClientLabel(auditLog.userAgent)} /></div>
            </dl>
          )}
        </div>
      </section>
    </div>
  )
}
