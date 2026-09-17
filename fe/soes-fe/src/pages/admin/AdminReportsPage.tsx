import { AlertTriangle, BarChart3, Download, RefreshCw } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import DataTable, { type ColumnDef } from '../../components/common/DataTable'
import AdminButton from './components/AdminButton'
import AdminLayout from './components/AdminLayout'
import AdminPageHeader from './components/AdminPageHeader'
import AdminTablePanel from './components/AdminTablePanel'
import { useAdminReportsOverview } from './hooks/useAdminMonitoring'
import type { AdminReportRowDto, AdminReportsDto } from './api/admin-monitoring.api'

type LowCorrectQuestion = AdminReportsDto['lowCorrectQuestions'][number]
type ReviewAttempt = AdminReportsDto['reviewAttempts'][number]

export default function AdminReportsPage() {
  const { data, loading, error, retry } = useAdminReportsOverview()
  const rows = data?.rows ?? []
  const lowCorrectQuestions = data?.lowCorrectQuestions ?? []
  const reviewAttempts = data?.reviewAttempts ?? []
  const kpis = data?.kpis ?? { schedules: 0, submissionRate: 0, averageScore: 0, violations: 0 }

  const reportColumns: ColumnDef<AdminReportRowDto>[] = [
    {
      header: 'CA THI ĐÃ KẾT THÚC',
      render: (item) => (
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-950">{item.scheduleTitle}</p>
          <p className="text-xs text-slate-400">{item.subjectCode} · {item.subject}</p>
        </div>
      ),
    },
    { header: 'LỚP', width: '180px', render: (item) => <span className="text-sm text-slate-700">{item.course || 'Chưa gán lớp'}</span> },
    { header: 'HOÀN THÀNH', width: '120px', render: (item) => <span className="text-sm text-slate-700">{item.submitted}/{item.participants}</span> },
    { header: 'ĐIỂM TB', width: '100px', render: (item) => <span className="text-sm font-semibold text-slate-800">{item.average}</span> },
    { header: 'CAO/THẤP', width: '120px', render: (item) => <span className="text-sm text-slate-700">{item.highest}/{item.lowest}</span> },
    { header: 'TỶ LỆ ĐẠT', width: '110px', render: (item) => <span className="text-sm text-slate-700">{item.passedRate}%</span> },
    { header: 'VI PHẠM', width: '100px', render: (item) => <span className={item.violations > 0 ? 'text-sm font-semibold text-rose-600' : 'text-sm text-slate-500'}>{item.violations}</span> },
  ]

  const questionColumns: ColumnDef<LowCorrectQuestion>[] = [
    {
      header: 'CÂU HỎI',
      render: (item) => (
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-950">{item.title}</p>
          <p className="text-xs text-slate-400">{item.subject} · {item.scheduleTitle}</p>
        </div>
      ),
    },
    { header: 'ĐÚNG/TỔNG', width: '110px', render: (item) => <span className="text-sm text-slate-700">{item.correct}/{item.answered}</span> },
    { header: 'TỶ LỆ ĐÚNG', width: '120px', render: (item) => <span className="text-sm font-semibold text-rose-600">{item.correctRate}%</span> },
  ]

  const reviewColumns: ColumnDef<ReviewAttempt>[] = [
    {
      header: 'BÀI THI CẦN RÀ SOÁT',
      render: (item) => (
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-950">{item.studentName}</p>
          <p className="text-xs text-slate-400">{item.studentCode} · {item.courseCode}</p>
        </div>
      ),
    },
    { header: 'CA THI', width: '220px', render: (item) => <span className="text-sm text-slate-700">{item.scheduleTitle}</span> },
    { header: 'ĐIỂM', width: '90px', render: (item) => <span className="text-sm text-slate-700">{item.score ?? '-'}</span> },
    { header: 'VI PHẠM', width: '100px', render: (item) => <span className="text-sm font-semibold text-rose-600">{item.violationCount}</span> },
    { header: 'LÝ DO', width: '220px', render: (item) => <span className="text-sm text-slate-700">{item.reason}</span> },
  ]

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={<BarChart3 size={20} />}
        title="Báo cáo"
        description="Dùng sau khi ca thi kết thúc: tổng hợp kết quả, phổ điểm, chất lượng câu hỏi và danh sách bài cần rà soát."
        action={(
          <div className="flex gap-2">
            <AdminButton icon={<RefreshCw size={17} />} onClick={retry}>Làm mới</AdminButton>
            <AdminButton icon={<Download size={17} />} onClick={() => exportCsv(rows)}>Xuất CSV</AdminButton>
          </div>
        )}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Ca thi đã kết thúc" value={String(kpis.schedules)} />
        <Kpi label="Tỷ lệ hoàn thành" value={`${kpis.submissionRate}%`} />
        <Kpi label="Điểm trung bình" value={String(kpis.averageScore)} />
        <Kpi label="Cảnh báo vi phạm" value={String(kpis.violations)} tone="rose" />
      </div>

      <div className="mb-5 grid gap-5 xl:grid-cols-[1fr_0.95fr]">
        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Phổ điểm</h2>
            <span className="text-xs text-slate-400">Theo bài đã chấm</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.distribution ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#059669" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle size={17} className="text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-900">Ưu tiên hậu kiểm</h2>
          </div>
          <div className="space-y-3 text-sm text-slate-600">
            <PriorityRow label="Câu hỏi tỷ lệ đúng thấp" value={lowCorrectQuestions.length} />
            <PriorityRow label="Bài thi có dấu hiệu bất thường" value={reviewAttempts.length} tone="rose" />
            <PriorityRow label="Ca thi có vi phạm" value={rows.filter((row) => row.violations > 0).length} />
          </div>
        </section>
      </div>

      {error && <div className="mb-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="mb-5 grid gap-5 xl:grid-cols-2">
        <AdminTablePanel>
          <DataTable
            columns={questionColumns}
            data={loading ? [] : lowCorrectQuestions}
            keyExtractor={(item) => `${item.scheduleTitle}-${item.id}`}
            emptyText={loading ? 'Đang tải dữ liệu câu hỏi...' : 'Chưa có câu hỏi cần xem lại.'}
          />
        </AdminTablePanel>

        <AdminTablePanel>
          <DataTable
            columns={reviewColumns}
            data={loading ? [] : reviewAttempts}
            keyExtractor={(item) => item.id}
            emptyText={loading ? 'Đang tải dữ liệu rà soát...' : 'Chưa có bài thi cần rà soát.'}
          />
        </AdminTablePanel>
      </div>

      <AdminTablePanel>
        <DataTable
          columns={reportColumns}
          data={loading ? [] : rows}
          keyExtractor={(item) => item.id}
          emptyText={loading ? 'Đang tải dữ liệu báo cáo...' : 'Chưa có ca thi đã kết thúc để báo cáo.'}
        />
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

function PriorityRow({ label, value, tone = 'slate' }: { label: string; value: number; tone?: 'slate' | 'rose' }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
      <span>{label}</span>
      <span className={`font-semibold ${tone === 'rose' ? 'text-rose-600' : 'text-slate-900'}`}>{value}</span>
    </div>
  )
}

function exportCsv(rows: AdminReportRowDto[]) {
  const headers = ['Ca thi', 'Môn học', 'Lớp', 'Hoàn thành', 'Điểm TB', 'Cao nhất', 'Thấp nhất', 'Tỷ lệ đạt', 'Vi phạm']
  const body = rows.map((row) => [
    row.scheduleTitle,
    row.subject,
    row.course,
    `${row.submitted}/${row.participants}`,
    row.average,
    row.highest,
    row.lowest,
    `${row.passedRate}%`,
    row.violations,
  ])
  const csv = [headers, ...body].map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `bao-cao-thi-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}
