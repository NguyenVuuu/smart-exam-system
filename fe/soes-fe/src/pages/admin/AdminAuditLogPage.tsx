import { Download, RefreshCw, ScrollText } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { exportAdminAuditLogs, getAdminAuditLog } from './api/admin-audit-logs.api'
import AdminLayout from './components/AdminLayout'
import AdminButton from './components/AdminButton'
import AdminPageHeader from './components/AdminPageHeader'
import AdminTablePanel from './components/AdminTablePanel'
import AuditLogDetailModal from './components/audit-log/AuditLogDetailModal'
import AuditLogFilters from './components/audit-log/AuditLogFilters'
import AuditLogStats from './components/audit-log/AuditLogStats'
import AuditLogTable from './components/audit-log/AuditLogTable'
import { useAdminAuditLogs } from './hooks/useAdminAuditLogs'
import { useAuditLogFilters } from './hooks/useAuditLogFilters'
import type { AdminAuditLogDetailApiDto } from './types/admin-api.types'
import { downloadBlob } from './utils/audit-log.utils'

const PAGE_SIZE = 10

export default function AdminAuditLogPage() {
  const filterState = useAuditLogFilters(PAGE_SIZE)
  const { logs, overview, refresh } = useAdminAuditLogs(filterState.filters)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<AdminAuditLogDetailApiDto>()
  const [detailLoading, setDetailLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  const openDetail = async (id: string) => {
    setSelectedId(id)
    setDetail(undefined)
    setDetailLoading(true)
    try {
      setDetail(await getAdminAuditLog(id))
    } catch {
      setSelectedId(null)
      toast.error('Không thể tải chi tiết nhật ký.')
    } finally {
      setDetailLoading(false)
    }
  }

  const exportLogs = async () => {
    setExporting(true)
    try {
      const filename = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`
      downloadBlob(await exportAdminAuditLogs(filterState.exportFilters), filename)
      toast.success('Đã xuất nhật ký theo bộ lọc hiện tại.')
    } catch {
      toast.error('Không thể xuất nhật ký. Vui lòng thử lại.')
    } finally {
      setExporting(false)
    }
  }

  const closeDetail = () => {
    setSelectedId(null)
    setDetail(undefined)
  }

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={<ScrollText size={20} />}
        title="Nhật ký hệ thống"
        description="Theo dõi các thao tác quan trọng và truy vết thay đổi trong hệ thống."
        action={(
          <div className="flex gap-2">
            <AdminButton
              tone="secondary"
              icon={<RefreshCw size={16} />}
              onClick={() => void refresh()}
              disabled={logs.isFetching}
            >
              Làm mới
            </AdminButton>
            <AdminButton icon={<Download size={16} />} onClick={() => void exportLogs()} disabled={exporting}>
              {exporting ? 'Đang xuất...' : 'Xuất CSV'}
            </AdminButton>
          </div>
        )}
      />

      <AuditLogStats overview={overview.data} loading={overview.isLoading} />
      <AdminTablePanel>
        <AuditLogFilters
          values={filterState.values}
          actions={overview.data?.actions ?? []}
          entityTypes={overview.data?.entityTypes ?? []}
          onChange={filterState.update}
          onReset={filterState.reset}
        />
        <AuditLogTable
          items={logs.data?.items ?? []}
          pagination={logs.data?.pagination}
          page={filterState.page}
          pageSize={PAGE_SIZE}
          loading={logs.isLoading}
          error={logs.isError}
          onPageChange={filterState.setPage}
          onOpenDetail={(id) => void openDetail(id)}
          onRetry={() => void logs.refetch()}
        />
      </AdminTablePanel>

      {selectedId && (
        <AuditLogDetailModal auditLog={detail} loading={detailLoading} onClose={closeDetail} />
      )}
    </AdminLayout>
  )
}
