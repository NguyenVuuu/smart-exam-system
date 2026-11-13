import { Sparkles } from 'lucide-react'

export default function AutoExamGenerationActions({
  isGenerating,
  totalQuestions,
  onGenerate,
}: {
  isGenerating: boolean
  totalQuestions: number
  onGenerate: () => void
}) {
  return (
    <div className="flex justify-end pt-4 border-t border-gray-100">
      <button
        onClick={onGenerate}
        disabled={isGenerating || totalQuestions === 0}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center gap-2"
      >
        <Sparkles size={18} />
        {isGenerating ? 'Đang sinh đề...' : 'Sinh đề tự động'}
      </button>
    </div>
  )
}
