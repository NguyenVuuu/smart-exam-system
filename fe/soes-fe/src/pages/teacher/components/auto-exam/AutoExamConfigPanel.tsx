import { Layers } from 'lucide-react'
import AutoExamBaseConfig from './config/AutoExamBaseConfig'
import AutoExamDifficultyCountConfig from './config/AutoExamDifficultyCountConfig'
import AutoExamGenerationActions from './config/AutoExamGenerationActions'
import AutoExamManualQuestionPicker from './config/AutoExamManualQuestionPicker'
import AutoExamQuestionPickModeConfig from './config/AutoExamQuestionPickModeConfig'
import AutoExamQuestionSourceConfig from './config/AutoExamQuestionSourceConfig'
import type { AutoExamConfigPanelProps } from './config/AutoExamConfigTypes'

export default function AutoExamConfigPanel(props: AutoExamConfigPanelProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
      <h2 className="text-xs font-bold text-gray-900 flex items-center gap-2">
        <Layers size={18} className="text-blue-600" />
        Cấu Hình Sinh Đề Tự Động
      </h2>

      <div className="mt-5 space-y-5">
        <AutoExamBaseConfig {...props} />
        <AutoExamQuestionSourceConfig {...props} />
        <AutoExamQuestionPickModeConfig {...props} />
        {props.pickMode === 'MANUAL' && <AutoExamManualQuestionPicker {...props} />}
        {props.pickMode === 'AUTO' && <AutoExamDifficultyCountConfig {...props} />}
      </div>

      <AutoExamGenerationActions
        isGenerating={props.isGenerating}
        totalQuestions={props.totalQuestions}
        pickMode={props.pickMode}
        selectedQuestionCount={props.selectedQuestions.length}
        onGenerate={props.onGenerate}
      />
    </div>
  )
}
