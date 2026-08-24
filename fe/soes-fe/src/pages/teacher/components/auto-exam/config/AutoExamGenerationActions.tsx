import { Sparkles } from 'lucide-react'
import type { AutoExamPickMode } from '../../../types/teacher-auto-exam.types'

export default function AutoExamGenerationActions({
  isGenerating,
  totalQuestions,
  pickMode,
  selectedQuestionCount,
  onGenerate,
}: {
  isGenerating: boolean
  totalQuestions: number
  pickMode: AutoExamPickMode
  selectedQuestionCount: number
  onGenerate: () => void
}) {
  return (
    <div className="flex justify-end pt-3 border-t border-gray-100">
      <button
        onClick={onGenerate}
        disabled={isGenerating || totalQuestions === 0}
        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
      >
        <Sparkles size={16} />
        {isGenerating
          ? 'Đang sinh đề...'
          : pickMode === 'AUTO'
          ? 'Sinh đề'
          : `Sinh đề từ ${selectedQuestionCount} câu đã chọn`}
      </button>
    </div>
  )
}
