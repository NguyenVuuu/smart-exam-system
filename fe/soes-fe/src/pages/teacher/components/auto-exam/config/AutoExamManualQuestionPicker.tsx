import { CheckCircle2, Search, Trash2 } from 'lucide-react'
import type { AutoExamConfigPanelProps } from './AutoExamConfigTypes'

export default function AutoExamManualQuestionPicker(props: AutoExamConfigPanelProps) {
  return (
    <div className="space-y-3 p-4 bg-gray-50 border border-gray-100 rounded-xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold text-gray-900">Chọn Câu Hỏi Từ Ngân Hàng</h3>
          <p className="text-xs text-gray-500">
            Đã chọn {props.selectedQuestions.length} câu. Có thể bỏ chọn trước khi sinh đề.
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs w-full sm:w-64">
          <Search size={14} className="text-gray-400" />
          <input
            type="text"
            placeholder="Tìm nội dung câu hỏi..."
            value={props.questionSearch}
            onChange={(e) => props.setQuestionSearch(e.target.value)}
            className="bg-transparent focus:outline-none text-gray-800 w-full"
          />
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-xl bg-white">
        {props.filteredEligibleQuestions.map((question) => {
          const isSelected = props.selectedQuestionIds.includes(question.id)

          return (
            <button
              key={question.id}
              type="button"
              onClick={() => props.toggleQuestionSelection(question.id)}
              className={`w-full text-left p-3 flex items-start gap-3 hover:bg-blue-50/50 transition-colors ${
                isSelected ? 'bg-blue-50/70' : ''
              }`}
            >
              <span
                className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-300 text-transparent'
                }`}
              >
                <CheckCircle2 size={13} />
              </span>
              <span className="flex-1 space-y-1">
                <span className="block text-xs font-medium text-gray-900 line-clamp-2">
                  {question.content}
                </span>
                <span className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md">
                    {question.difficulty}
                  </span>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                    {question.type === 'SINGLE_CHOICE'
                      ? '1 đáp án'
                      : question.type === 'MULTIPLE_CHOICE'
                      ? 'Nhiều đáp án'
                      : question.type === 'TRUE_FALSE'
                      ? 'Đúng / Sai'
                      : 'Lập trình'}
                  </span>
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {props.selectedQuestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {props.selectedQuestions.map((question) => (
            <button
              key={question.id}
              type="button"
              onClick={() => props.toggleQuestionSelection(question.id)}
              className="px-2.5 py-1 bg-white border border-gray-200 text-gray-700 hover:text-rose-600 hover:border-rose-200 rounded-lg text-xs font-medium flex items-center gap-1"
            >
              {question.id}
              <Trash2 size={12} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
