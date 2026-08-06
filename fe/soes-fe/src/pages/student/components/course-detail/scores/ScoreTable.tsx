import { BarChart2 } from 'lucide-react'
import { useScores } from '../../../hooks/course-detail/useScores'
import type { ExamType } from '../../../types/course-detail.types'

interface ScoreTableProps {
  courseOfferingId: string
}

const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  MIDTERM: 'Giữa kỳ',
  FINAL: 'Cuối kỳ',
  QUIZ: 'Quiz',
}

function formatScore(score: number): string {
  return Number.isInteger(score) ? String(score) : score.toFixed(1)
}

function ScoreColor(score: number): string {
  if (score >= 8) return 'text-green-600 font-semibold'
  if (score >= 5) return 'text-yellow-600 font-semibold'
  return 'text-red-600 font-semibold'
}

function TableSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="divide-y divide-gray-100">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-3.5 animate-pulse">
            <div className="space-y-1.5">
              <div className="h-4 bg-gray-100 rounded w-32" />
              <div className="h-3 bg-gray-100 rounded w-16" />
            </div>
            <div className="h-6 bg-gray-100 rounded w-10" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ScoreTable({ courseOfferingId }: ScoreTableProps) {
  const { items, isLoading, error } = useScores(courseOfferingId)

  if (isLoading) return <TableSkeleton />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
        <BarChart2 size={36} className="text-gray-200" />
        <p className="text-sm">Chờ giảng viên nhập điểm</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Bài kiểm tra
        </span>
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Điểm</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-100">
        {items.map((item) => (
          <div key={item.examId} className="flex items-center justify-between px-5 py-3.5">
            <div>
              <p className="text-sm font-medium text-gray-900">{item.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {EXAM_TYPE_LABELS[item.type] ?? item.type}
              </p>
            </div>
            <span className={`text-base ${ScoreColor(item.score)}`}>
              {formatScore(item.score)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
