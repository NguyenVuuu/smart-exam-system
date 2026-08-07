import { ClipboardList } from 'lucide-react'
import type { ExamDetail } from '../../types/exam-detail.types'

interface ExamHeaderProps {
  data: ExamDetail
}

const EXAM_TYPE_LABELS: Record<string, string> = {
  MIDTERM: 'Giữa kỳ',
  FINAL: 'Cuối kỳ',
  QUIZ: 'Quiz',
}

const EXAM_TYPE_COLORS: Record<string, string> = {
  MIDTERM: 'bg-orange-50 text-orange-500',
  FINAL: 'bg-red-50 text-red-500',
  QUIZ: 'bg-purple-50 text-purple-500',
}

export default function ExamHeader({ data }: ExamHeaderProps) {
  const typeLabel = EXAM_TYPE_LABELS[data.type] ?? data.type
  const typeColor = EXAM_TYPE_COLORS[data.type] ?? 'bg-gray-50 text-gray-500'

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center w-10 h-10 bg-orange-50 rounded-xl shrink-0">
          <ClipboardList size={18} className="text-orange-500" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium text-orange-500 uppercase tracking-wide">
            Bài thi
          </span>
          <h2 className="text-lg font-semibold text-gray-900 leading-snug mt-0.5">
            {data.title}
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColor}`}
            >
              {typeLabel}
            </span>
          </div>
          {data.description && (
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">{data.description}</p>
          )}
        </div>
      </div>
    </div>
  )
}
