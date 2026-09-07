import { Eye } from 'lucide-react'
import AppBadge from '../../../../components/common/AppBadge'
import DataTable, { type ColumnDef } from '../../../../components/common/DataTable'
import { formatDateTime } from '../../../../utils/date.utils'
import { getAuditActionLabel, getAuditActionTone, getAuditEntityLabel, roleLabels } from '../../constants/audit-log.labels'
import type { AdminAuditLogApiDto, ApiPagination } from '../../types/admin-api.types'
import AdminButton from '../AdminButton'

interface AuditLogTableProps {
  items: AdminAuditLogApiDto[]
  pagination?: ApiPagination
  page: number
  pageSize: number
  loading: boolean
  error: boolean
  onPageChange: (page: number) => void
  onOpenDetail: (id: string) => void
  onRetry: () => void
}

export default function AuditLogTable(props: AuditLogTableProps) {
  if (props.error) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-rose-600">Không thể tải nhật ký hệ thống.</p>
        <AdminButton tone="secondary" onClick={props.onRetry}>Thử lại</AdminButton>
      </div>
    )
  }

  const columns: ColumnDef<AdminAuditLogApiDto>[] = [
    { header: 'THỜI GIAN', width: '155px', render: (auditLog) => <span className="whitespace-nowrap text-slate-700">{formatDateTime(auditLog.createdAt)}</span> },
    { header: 'NGƯỜI THỰC HIỆN', width: '220px', render: (auditLog) => <ActorCell auditLog={auditLog} /> },
    { header: 'HÀNH ĐỘNG', width: '210px', render: (auditLog) => <AppBadge tone={getAuditActionTone(auditLog.action)} shape="rounded">{getAuditActionLabel(auditLog.action)}</AppBadge> },
    { header: 'ĐỐI TƯỢNG', width: '220px', render: (auditLog) => <EntityCell auditLog={auditLog} /> },
    { header: 'IP', width: '130px', render: (auditLog) => <span className="font-mono text-xs text-slate-500">{auditLog.ipAddress || '-'}</span> },
    { header: 'THAO TÁC', width: '84px', align: 'center', render: (auditLog) => (
      <button
        type="button"
        onClick={(event) => { event.stopPropagation(); props.onOpenDetail(auditLog.id) }}
        title="Xem chi tiết"
        className="rounded-lg p-2 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
      >
        <Eye size={17} />
      </button>
    ) },
  ]

  return (
    <DataTable
      embedded
      columns={columns}
      data={props.items}
      keyExtractor={(auditLog) => auditLog.id}
      isLoading={props.loading}
      page={props.pagination?.page ?? props.page}
      pageSize={props.pageSize}
      totalItems={props.pagination?.totalItems ?? 0}
      totalPages={props.pagination?.totalPages ?? 1}
      onPageChange={props.onPageChange}
      onRowClick={(auditLog) => props.onOpenDetail(auditLog.id)}
      emptyText="Chưa có nhật ký phù hợp với bộ lọc."
    />
  )
}

const ActorCell = ({ auditLog }: { auditLog: AdminAuditLogApiDto }) => (
  <div>
    <p className="font-semibold text-slate-950">{auditLog.actor.fullName}</p>
    <p className="mt-0.5 text-xs text-slate-400">{auditLog.actor.code || auditLog.actor.email || roleLabels[auditLog.actor.role]}</p>
  </div>
)

const EntityCell = ({ auditLog }: { auditLog: AdminAuditLogApiDto }) => (
  <div>
    <p className="font-medium text-slate-700">{getAuditEntityLabel(auditLog.entityType)}</p>
    <p className="mt-0.5 max-w-44 truncate font-mono text-xs text-slate-400" title={auditLog.entityId}>{auditLog.entityId}</p>
  </div>
)
