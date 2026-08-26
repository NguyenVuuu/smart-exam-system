import { BarChart3, Download } from 'lucide-react'
import DataTable, { type ColumnDef } from '../../components/common/DataTable'
import AdminButton from './components/AdminButton'
import AdminLayout from './components/AdminLayout'
import AdminPageHeader from './components/AdminPageHeader'
import AdminTablePanel from './components/AdminTablePanel'

interface ReportRow {
  id: string
  subject: string
  course: string
  participants: string
  average: number
  passedRate: string
  violations: number
}

const REPORT_ROWS: ReportRow[] = [
  { id: 'r-1', subject: 'Lập trình Java', course: 'JAVA_01_HK1_2026', participants: '48/48', average: 8.1, passedRate: '92%', violations: 3 },
  { id: 'r-2', subject: 'Lập trình Java', course: 'JAVA_02_HK1_2026', participants: '53/55', average: 7.8, passedRate: '88%', violations: 2 },
  { id: 'r-3', subject: 'Cơ sở dữ liệu', course: 'DB_01_HK1_2026', participants: '39/39', average: 7.6, passedRate: '85%', violations: 1 },
]

export default function AdminReportsPage() {
  const columns: ColumnDef<ReportRow>[] = [
    { header: 'MÔN HỌC', render: (item) => <span className="text-sm font-semibold text-slate-950">{item.subject}</span> },
    { header: 'LỚP', width: '190px', render: (item) => <span className="text-sm text-slate-700">{item.course}</span> },
    { header: 'THAM GIA', width: '120px', render: (item) => <span className="text-sm text-slate-700">{item.participants}</span> },
    { header: 'ĐIỂM TB', width: '110px', render: (item) => <span className="text-sm font-semibold text-slate-800">{item.average}</span> },
    { header: 'TỶ LỆ ĐẠT', width: '130px', render: (item) => <span className="text-sm text-slate-700">{item.passedRate}</span> },
    { header: 'VI PHẠM', width: '110px', render: (item) => <span className={item.violations > 0 ? 'text-sm font-semibold text-rose-600' : 'text-sm text-slate-500'}>{item.violations}</span> },
  ]

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={<BarChart3 size={20} />}
        title="Báo cáo"
        description="Báo cáo toàn trường theo học kỳ, môn, lớp, kết quả thi và cảnh báo vi phạm."
        action={<AdminButton icon={<Download size={17} />} onClick={() => alert('Đã tạo tác vụ xuất báo cáo Excel mẫu.')}>Xuất báo cáo</AdminButton>}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Ca thi" value="12" />
        <Kpi label="Tỷ lệ nộp bài" value="96%" />
        <Kpi label="Điểm trung bình" value="7.9" />
        <Kpi label="Cảnh báo vi phạm" value="6" tone="rose" />
      </div>

      <AdminTablePanel>
        <DataTable columns={columns} data={REPORT_ROWS} keyExtractor={(item) => item.id} emptyText="Chưa có dữ liệu báo cáo." />
      </AdminTablePanel>
    </AdminLayout>
  )
}

function Kpi({ label, value, tone = 'emerald' }: { label: string; value: string; tone?: 'emerald' | 'rose' }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${tone === 'rose' ? 'text-rose-600' : 'text-emerald-600'}`}>{value}</p>
    </div>
  )
}
