import { Eye, MessageSquareWarning, ShieldAlert } from 'lucide-react'
import DataTable, { type ColumnDef } from '../../components/common/DataTable'
import { ADMIN_PROCTOR_SESSIONS } from './mock/admin.mock'
import type { AdminProctorSession } from './types/admin.types'
import { AdminStatusBadge } from './components/AdminBadges'
import AdminLayout from './components/AdminLayout'
import AdminPageHeader from './components/AdminPageHeader'
import AdminTablePanel from './components/AdminTablePanel'

export default function AdminProctoringPage() {
  const totals = ADMIN_PROCTOR_SESSIONS.reduce((acc, item) => ({
    online: acc.online + item.online,
    inProgress: acc.inProgress + item.inProgress,
    submitted: acc.submitted + item.submitted,
    warnings: acc.warnings + item.warnings,
  }), { online: 0, inProgress: 0, submitted: 0, warnings: 0 })

  const columns: ColumnDef<AdminProctorSession>[] = [
    {
      header: 'CA THI',
      render: (item) => (
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-950">{item.scheduleName}</p>
          <p className="text-xs text-slate-400">{item.courseCode}</p>
        </div>
      ),
    },
    { header: 'ONLINE', width: '110px', render: (item) => <span className="text-sm font-semibold text-slate-800">{item.online}</span> },
    { header: 'ĐANG LÀM', width: '120px', render: (item) => <span className="text-sm text-slate-700">{item.inProgress}</span> },
    { header: 'ĐÃ NỘP', width: '110px', render: (item) => <span className="text-sm text-slate-700">{item.submitted}</span> },
    { header: 'MẤT KẾT NỐI', width: '150px', render: (item) => <span className="text-sm text-slate-700">{item.disconnected}</span> },
    { header: 'CẢNH BÁO', width: '120px', render: (item) => <span className={item.warnings > 0 ? 'text-sm font-semibold text-rose-600' : 'text-sm text-slate-500'}>{item.warnings}</span> },
    { header: 'TRẠNG THÁI', width: '140px', render: (item) => <AdminStatusBadge status={item.status} /> },
    {
      header: 'THAO TÁC',
      width: '120px',
      align: 'right',
      render: () => (
        <div className="flex justify-end gap-1 text-slate-500">
          <button className="rounded-lg p-1.5 hover:bg-blue-50 hover:text-blue-600" title="Xem giám sát"><Eye size={17} /></button>
          <button className="rounded-lg p-1.5 hover:bg-amber-50 hover:text-amber-600" title="Gửi thông báo vận hành"><MessageSquareWarning size={17} /></button>
        </div>
      ),
    },
  ]

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={<ShieldAlert size={20} />}
        title="Giám sát thi"
        description="Theo dõi realtime toàn trường: ca đang mở, kết nối, cảnh báo gian lận và sự cố vận hành."
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Online" value={totals.online} />
        <Kpi label="Đang làm" value={totals.inProgress} />
        <Kpi label="Đã nộp" value={totals.submitted} />
        <Kpi label="Cảnh báo" value={totals.warnings} tone="rose" />
      </div>

      <AdminTablePanel>
        <DataTable columns={columns} data={ADMIN_PROCTOR_SESSIONS} keyExtractor={(item) => item.id} emptyText="Chưa có ca thi cần giám sát." />
      </AdminTablePanel>
    </AdminLayout>
  )
}

function Kpi({ label, value, tone = 'emerald' }: { label: string; value: number; tone?: 'emerald' | 'rose' }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${tone === 'rose' ? 'text-rose-600' : 'text-emerald-600'}`}>{value}</p>
    </div>
  )
}
