import type { AutoExamConfigPanelProps } from './AutoExamConfigTypes'
import { AvailabilityCard } from './AutoExamConfigControls'

export default function AutoExamQuestionSourceConfig(props: AutoExamConfigPanelProps) {
  const easyAvailable = props.eligibleQuestions.filter((q) => q.difficulty === 'EASY').length
  const mediumAvailable = props.eligibleQuestions.filter((q) => q.difficulty === 'MEDIUM').length
  const hardAvailable = props.eligibleQuestions.filter((q) => q.difficulty === 'HARD').length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Nguồn Câu Hỏi</h3>
        <span className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
          {props.eligibleQuestions.length} câu khả dụng
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <AvailabilityCard label="Mức độ Dễ" value={easyAvailable} />
        <AvailabilityCard label="Mức độ Trung bình" value={mediumAvailable} />
        <AvailabilityCard label="Mức độ Khó" value={hardAvailable} />
      </div>
    </div>
  )
}
