import type { AutoExamConfigPanelProps } from './AutoExamConfigTypes'
import { DifficultyRange } from './AutoExamConfigControls'

export default function AutoExamDifficultyCountConfig(props: AutoExamConfigPanelProps) {
  return (
    <div className="space-y-4 pt-2">
      <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
        Số Lượng Câu Hỏi Theo Độ Khó
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DifficultyRange label="1. Mức Độ Dễ (Easy):" value={props.easyCount} max={40} onChange={props.setEasyCount} />
        <DifficultyRange label="2. Mức Độ Trung Bình (Medium):" value={props.mediumCount} max={40} onChange={props.setMediumCount} />
        <DifficultyRange label="3. Mức Độ Khó (Hard):" value={props.hardCount} max={20} onChange={props.setHardCount} />
      </div>
    </div>
  )
}
