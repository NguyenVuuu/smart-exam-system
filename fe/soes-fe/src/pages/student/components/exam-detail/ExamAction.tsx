import type { ExamDetail } from '../../types/exam-detail.types'

interface ExamActionProps {
  data: ExamDetail
}

export default function ExamAction({ data }: ExamActionProps) {
  const { canStart, canResume, status } = data

  if (status === 'SUBMITTED') {
    return (
      <button
        disabled
        className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
      >
        Đã nộp bài
      </button>
    )
  }

  if (status === 'EXPIRED') {
    return (
      <button
        disabled
        className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
      >
        Đã hết hạn
      </button>
    )
  }

  if (!canStart) {
    return (
      <button
        disabled
        className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
      >
        Vào làm bài
      </button>
    )
  }

  const label = canResume ? 'Tiếp tục làm bài' : 'Vào làm bài'

  return (
    <button
      disabled
      className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg opacity-60 cursor-not-allowed"
      title="Tính năng đang phát triển"
    >
      {label}
    </button>
  )
}
