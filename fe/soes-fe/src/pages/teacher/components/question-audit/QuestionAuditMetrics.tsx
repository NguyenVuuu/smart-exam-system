import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import type { QuestionAuditSummaryDto } from '../../types/teacher-question-api.types'

interface QuestionAuditMetricsProps {
  metrics?: QuestionAuditSummaryDto
  loading?: boolean
}

export default function QuestionAuditMetrics({ metrics, loading }: QuestionAuditMetricsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <MetricCard
        label="Câu cần sửa"
        value={metrics?.requiredQuestionCount ?? 0}
        icon={<XCircle size={20} />}
        tone="rose"
        loading={loading}
      />
      <MetricCard
        label="Câu cần lưu ý"
        value={metrics?.warningQuestionCount ?? 0}
        icon={<AlertCircle size={20} />}
        tone="amber"
        loading={loading}
      />
      <MetricCard
        label="Câu đạt chuẩn"
        value={metrics?.qualifiedQuestionCount ?? 0}
        icon={<CheckCircle2 size={20} />}
        tone="emerald"
        loading={loading}
      />
    </div>
  )
}

function MetricCard({
  label,
  value,
  icon,
  tone,
  loading,
}: {
  label: string
  value: number
  icon: React.ReactNode
  tone: 'rose' | 'amber' | 'emerald'
  loading?: boolean
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
        <p className={`text-xl font-bold leading-tight ${loading ? 'animate-pulse text-gray-300' : 'text-gray-900'}`}>
          {loading ? '--' : value}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}
