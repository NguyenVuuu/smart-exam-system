import { AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react'
import type { ExamDetail } from '../../types/exam-detail.types'

interface ExamStatusCardProps {
  data: ExamDetail
}

function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  if (h > 0) {
    return `${h} giờ ${String(m).padStart(2, '0')} phút`
  }
  if (m > 0) {
    return `${m} phút ${String(s).padStart(2, '0')} giây`
  }
  return `${s} giây`
}

export default function ExamStatusCard({ data }: ExamStatusCardProps) {
  const { status, remainingSeconds } = data

  if (status === 'NOT_STARTED') {
    return (
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
        <Clock size={18} className="text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-700">Chưa đến thời gian thi</p>
          <p className="text-xs text-blue-500 mt-0.5">
            Bài thi chưa bắt đầu. Vui lòng quay lại khi đến giờ.
          </p>
        </div>
      </div>
    )
  }

  if (status === 'AVAILABLE') {
    return (
      <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-start gap-3">
        <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-green-700">Có thể làm bài</p>
          {remainingSeconds !== null && remainingSeconds > 0 && (
            <p className="text-xs text-green-600 mt-0.5">
              Thời gian còn lại: <span className="font-medium">{formatSeconds(remainingSeconds)}</span>
            </p>
          )}
        </div>
      </div>
    )
  }

  if (status === 'SUBMITTED') {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-3">
        <CheckCircle2 size={18} className="text-gray-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-gray-700">Đã nộp bài</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Bài thi đã được nộp. Chờ giảng viên công bố kết quả.
          </p>
        </div>
      </div>
    )
  }

  if (status === 'EXPIRED') {
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
        <XCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-red-700">Đã hết thời gian</p>
          <p className="text-xs text-red-500 mt-0.5">
            Thời gian làm bài đã kết thúc.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 flex items-start gap-3">
      <AlertCircle size={18} className="text-yellow-500 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-yellow-700">Trạng thái không xác định</p>
      </div>
    </div>
  )
}
