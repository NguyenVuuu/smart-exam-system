import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import type { AuditMetrics } from '../../utils/QuestionAuditRules'

interface QuestionAuditMetricsProps {
  metrics: AuditMetrics
}

export default function QuestionAuditMetrics({ metrics }: QuestionAuditMetricsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <MetricCard
        label="Lỗi bắt buộc"
        value={metrics.requiredErrors}
        icon={<XCircle size={20} />}
        tone="rose"
      />
      <MetricCard
        label="Cảnh báo"
        value={metrics.warnings}
        icon={<AlertCircle size={20} />}
        tone="amber"
      />
      <MetricCard
        label="Câu đạt chuẩn"
        value={metrics.qualifiedCount}
        icon={<CheckCircle2 size={20} />}
        tone="emerald"
      />
    </div>
  )
}

function MetricCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: number
  icon: React.ReactNode
  tone: 'rose' | 'amber' | 'emerald'
}) {
  const toneClass = {
    rose: 'bg-rose-50 text-rose-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  }[tone]

  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${toneClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}
