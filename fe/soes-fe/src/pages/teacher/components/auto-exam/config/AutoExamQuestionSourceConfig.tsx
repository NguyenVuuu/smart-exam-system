import type { AutoExamConfigPanelProps } from './AutoExamConfigTypes'
import { AvailabilityCard } from './AutoExamConfigControls'

export default function AutoExamQuestionSourceConfig(props: AutoExamConfigPanelProps) {
  const easyAvailable = props.eligibleQuestions.filter((q) => q.difficulty === 'EASY').length
  const mediumAvailable = props.eligibleQuestions.filter((q) => q.difficulty === 'MEDIUM').length
  const hardAvailable = props.eligibleQuestions.filter((q) => q.difficulty === 'HARD').length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Nguồn Câu Hỏi</h3>
        <span className="text-xs font-medium text-blue-700">{props.eligibleQuestions.length} câu khả dụng</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        <AvailabilityCard label="Dễ" value={easyAvailable} />
        <AvailabilityCard label="Trung bình" value={mediumAvailable} />
        <AvailabilityCard label="Khó" value={hardAvailable} />
      </div>
    </div>
  )
}
