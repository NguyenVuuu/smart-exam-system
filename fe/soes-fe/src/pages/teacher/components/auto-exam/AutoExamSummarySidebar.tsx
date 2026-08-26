import type { AutoExamPickMode } from '../../types/teacher-auto-exam.types'

export default function AutoExamSummarySidebar({
  totalQuestions,
  pickMode,
  easyCount,
  mediumCount,
  hardCount,
  selectedQuestionCount,
  targetTotalPoints,
}: {
  totalQuestions: number
  pickMode: AutoExamPickMode
  easyCount: number
  mediumCount: number
  hardCount: number
  selectedQuestionCount: number
  targetTotalPoints: number
}) {
  const pointsPerQuestion = totalQuestions > 0 ? Number((targetTotalPoints / totalQuestions).toFixed(2)) : 0

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 h-fit xl:sticky xl:top-6">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
        Tổng Quan Đề Tự Động
      </h3>
      <div className="text-3xl font-bold text-gray-900">
        {totalQuestions} <span className="text-sm font-normal text-gray-500">câu hỏi / đề</span>
      </div>

      <div className="space-y-3 text-sm border-t border-gray-100 pt-4">
        {pickMode === 'AUTO' ? (
          <>
            <SummaryLine label="Câu dễ:" value={`${easyCount} câu`} />
            <SummaryLine label="Câu trung bình:" value={`${mediumCount} câu`} />
            <SummaryLine label="Câu khó:" value={`${hardCount} câu`} />
          </>
        ) : (
          <SummaryLine label="Đã chọn:" value={`${selectedQuestionCount} câu`} />
        )}
        <SummaryLine label="Tổng điểm:" value={`${targetTotalPoints} điểm`} />
        <SummaryLine label="Điểm mỗi câu:" value={`${pointsPerQuestion} điểm`} />
        <SummaryLine label="Loại câu hỏi:" value="Trắc nghiệm" />
      </div>
    </div>
  )
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className="font-semibold text-gray-900 text-sm">{value}</span>
    </div>
  )
}
