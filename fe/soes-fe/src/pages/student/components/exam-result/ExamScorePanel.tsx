import type { AttemptResult } from '../../api/student-take-exam.api'

const pendingMessages: Record<AttemptResult['reason'], string> = {
  AVAILABLE: '',
  GRADING: 'Bài làm đang được chấm. Điểm sẽ hiển thị khi hoàn tất.',
  PENDING_RELEASE: 'Điểm chưa được công bố theo cấu hình của ca thi.',
  NEVER: 'Ca thi này không công bố điểm cho sinh viên.',
}

function formatDateTime(value: string | null) {
  return value ? new Date(value).toLocaleString('vi-VN') : null
}

export default function ExamScorePanel({ result }: { result: AttemptResult }) {
  if (!result.available) {
    const releaseAt = result.reason === 'PENDING_RELEASE' && result.releaseMode === 'SCHEDULED'
      ? formatDateTime(result.releaseAt)
      : null
    return (
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
        {releaseAt ? `Điểm sẽ được công bố lúc ${releaseAt}.` : pendingMessages[result.reason]}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
      <p className="text-sm text-emerald-700">Điểm bài thi</p>
      <p className="mt-1 text-2xl font-semibold text-emerald-900">
        {result.score} / {result.maxScore}
      </p>
    </div>
  )
}
