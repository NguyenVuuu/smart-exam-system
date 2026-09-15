import { BarChart2, CheckCircle2, Users } from 'lucide-react'

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
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase text-gray-500">Tổng bài nộp</p>
          <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
            <Users size={16} />
          </div>
        </div>
        <p className="mt-2 text-2xl font-bold text-gray-900">{totalSubmissions}</p>
        <p className="mt-1 text-xs text-gray-400">Đã hoàn thành</p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase text-gray-500">Điểm trung bình</p>
          <div className="rounded-xl bg-purple-50 p-2 text-purple-600">
            <BarChart2 size={16} />
          </div>
        </div>
        <p className="mt-2 text-2xl font-bold text-gray-900">
          {totalSubmissions > 0 ? avgScore.toFixed(2) : '-'}
        </p>
        <p className="mt-1 text-xs text-gray-400">Thang điểm 10</p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase text-gray-500">Cao nhất / Thấp nhất</p>
          <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
            <CheckCircle2 size={16} />
          </div>
        </div>
        <p className="mt-2 text-2xl font-bold text-gray-900">
          {totalSubmissions > 0 ? `${maxScore.toFixed(1)} / ${minScore.toFixed(1)}` : '-'}
        </p>
        <p className="mt-1 text-xs text-gray-400">Max / Min</p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase text-gray-500">Tỷ lệ đạt (≥ 4.0)</p>
          <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
            <CheckCircle2 size={16} />
          </div>
        </div>
        <p className="mt-2 text-2xl font-bold text-gray-900">
          {totalSubmissions > 0 ? `${passRate}%` : '-'}
        </p>
        <p className="mt-1 text-xs text-gray-400">{passCount}/{totalSubmissions} sinh viên</p>
      </div>
    </div>
  )
}
