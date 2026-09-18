import AppBadge from '../../../../components/common/AppBadge'
import DataTable, { type ColumnDef } from '../../../../components/common/DataTable'
import type { AdminReportRowDto } from '../../api/admin-monitoring.api'
import AdminTablePanel from '../AdminTablePanel'

const reportColumns: ColumnDef<AdminReportRowDto>[] = [
  { header: 'CA THI ĐÃ KẾT THÚC', render: (report) => <ScheduleCell report={report} /> },
  { header: 'LỚP', width: '170px', className: 'whitespace-nowrap', render: (report) => report.course || 'Chưa gán lớp' },
  { header: 'HOÀN THÀNH', width: '130px', className: 'whitespace-nowrap', render: (report) => <span className="font-medium text-slate-700">{report.submitted} / {report.participants}</span> },
  { header: 'ĐIỂM TB', width: '110px', className: 'whitespace-nowrap', render: (report) => <span className="font-semibold text-slate-900">{report.average}</span> },
  { header: 'CAO / THẤP', width: '130px', className: 'whitespace-nowrap', render: (report) => `${report.highest} / ${report.lowest}` },
  { header: 'TỶ LỆ ĐẠT', width: '120px', className: 'whitespace-nowrap', render: (report) => <AppBadge tone={report.passedRate >= 50 ? 'emerald' : 'amber'} shape="rounded">{report.passedRate}%</AppBadge> },
  { header: 'VI PHẠM', width: '110px', className: 'whitespace-nowrap', render: (report) => <ViolationCount count={report.violations} /> },
]

interface ReportScheduleTableProps {
  rows: AdminReportRowDto[]
  loading: boolean
}

export default function ReportScheduleTable({ rows, loading }: ReportScheduleTableProps) {
  return (
    <AdminTablePanel>
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-950">Kết quả theo ca thi</h2>
        <p className="mt-1 text-xs text-slate-500">Đối chiếu mức độ hoàn thành, kết quả và cảnh báo của từng ca đã kết thúc.</p>
      </div>
      <DataTable embedded columns={reportColumns} data={loading ? [] : rows} keyExtractor={(report) => report.id} isLoading={loading} pageSize={10} emptyText="Chưa có ca thi đã kết thúc để báo cáo." />
    </AdminTablePanel>
  )
}

function ScheduleCell({ report }: { report: AdminReportRowDto }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-semibold text-slate-950" title={report.scheduleTitle}>{report.scheduleTitle}</p>
      <p className="mt-1 truncate text-xs text-slate-400" title={`${report.subjectCode} · ${report.subject}`}>{report.subjectCode} · {report.subject}</p>
    </div>
  )
}

function ViolationCount({ count }: { count: number }) {
  if (count === 0) return <span className="text-slate-400">0</span>
  return <AppBadge tone="rose" shape="rounded">{count}</AppBadge>
}
