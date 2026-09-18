import { BarChart3, CheckCircle2, Gauge, Users } from 'lucide-react'
import type { ReactNode } from 'react'

export interface GradeStatisticsCardsProps {
  totalSubmissions: number
  avgScore: number
  maxScore: number
  minScore: number
  passCount: number
  passRate: string
}

export default function GradeStatisticsCards({
  totalSubmissions,
  avgScore,
  maxScore,
  minScore,
  passCount,
  passRate,
}: GradeStatisticsCardsProps) {
  const statistics = [
    {
      label: 'Tổng bài nộp',
      value: totalSubmissions,
      note: 'Sinh viên đã hoàn thành',
      icon: <Users size={17} />,
      tone: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Điểm trung bình',
      value: totalSubmissions > 0 ? avgScore.toFixed(2) : '-',
      note: 'Theo thang điểm 10',
      icon: <BarChart3 size={17} />,
      tone: 'bg-cyan-50 text-cyan-700',
    },
    {
      label: 'Cao nhất / Thấp nhất',
      value: totalSubmissions > 0 ? `${maxScore.toFixed(1)} / ${minScore.toFixed(1)}` : '-',
      note: 'Khoảng điểm ghi nhận',
      icon: <Gauge size={17} />,
      tone: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Tỷ lệ đạt',
      value: totalSubmissions > 0 ? `${passRate}%` : '-',
      note: `${passCount}/${totalSubmissions} sinh viên đạt từ 4.0`,
      icon: <CheckCircle2 size={17} />,
      tone: 'bg-emerald-50 text-emerald-700',
    },
  ]
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {statistics.map((statistic) => <StatisticCard key={statistic.label} {...statistic} />)}
    </div>
  )
}

function StatisticCard({
  label,
  value,
  note,
  icon,
  tone,
}: {
  label: string
  value: string | number
  note: string
  icon: ReactNode
  tone: string
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <span className={`grid h-9 w-9 place-items-center rounded-lg ${tone}`}>{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 truncate text-xs text-slate-400" title={note}>{note}</p>
    </div>
  )
}
