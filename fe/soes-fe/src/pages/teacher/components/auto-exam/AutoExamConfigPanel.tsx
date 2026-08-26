import AutoExamBaseConfig from './config/AutoExamBaseConfig'
import AutoExamDifficultyCountConfig from './config/AutoExamDifficultyCountConfig'
import AutoExamGenerationActions from './config/AutoExamGenerationActions'
import AutoExamManualQuestionPicker from './config/AutoExamManualQuestionPicker'
import AutoExamQuestionPickModeConfig from './config/AutoExamQuestionPickModeConfig'
import AutoExamQuestionSourceConfig from './config/AutoExamQuestionSourceConfig'
import type { AutoExamConfigPanelProps } from './config/AutoExamConfigTypes'

export default function AutoExamConfigPanel(props: AutoExamConfigPanelProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col space-y-6">
      <div className="space-y-6">
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
