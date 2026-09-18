import { AlertTriangle, BarChart3, ClipboardCheck, HelpCircle, ShieldAlert } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { AdminReportsDto } from '../../api/admin-monitoring.api'

interface ReportAnalyticsPanelProps {
  distribution: AdminReportsDto['distribution']
  lowCorrectQuestionCount: number
  reviewAttemptCount: number
  schedulesWithViolations: number
}

export default function ReportAnalyticsPanel(props: ReportAnalyticsPanelProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.75fr)]">
      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 size={17} className="text-emerald-600" />
              <h2 className="text-sm font-semibold text-slate-950">Phân phối điểm toàn hệ thống</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">Số bài thi đã chấm theo từng khoảng điểm.</p>
          </div>
          <span className="shrink-0 rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-medium text-slate-500">Thang điểm 10</span>
        </div>

        <div className="h-64 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={props.distribution} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="count" name="Số bài" fill="#059669" radius={[5, 5, 0, 0]} maxBarSize={42} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle size={17} className="text-amber-500" />
          <h2 className="text-sm font-semibold text-slate-950">Ưu tiên hậu kiểm</h2>
        </div>
        <p className="mt-1 text-xs text-slate-500">Các nhóm dữ liệu cần quản trị viên chú ý.</p>

        <div className="mt-5 space-y-3">
          <PriorityMetric icon={HelpCircle} label="Câu hỏi tỷ lệ đúng thấp" value={props.lowCorrectQuestionCount} tone="amber" />
          <PriorityMetric icon={ClipboardCheck} label="Bài thi cần rà soát" value={props.reviewAttemptCount} tone="rose" />
          <PriorityMetric icon={ShieldAlert} label="Ca thi có vi phạm" value={props.schedulesWithViolations} tone="blue" />
        </div>
      </section>
    </div>
  )
}

interface PriorityMetricProps {
  icon: typeof AlertTriangle
  label: string
  value: number
  tone: 'amber' | 'rose' | 'blue'
}

function PriorityMetric({ icon: Icon, label, value, tone }: PriorityMetricProps) {
  const toneClassName = {
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    blue: 'bg-blue-50 text-blue-600',
  }[tone]

  return (
    <div className="flex min-h-14 items-center gap-3 rounded-lg border border-gray-100 px-3 py-2.5">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${toneClassName}`}><Icon size={16} /></div>
      <span className="min-w-0 flex-1 text-sm text-slate-600">{label}</span>
      <strong className="text-base font-semibold text-slate-950">{value}</strong>
    </div>
  )
}
