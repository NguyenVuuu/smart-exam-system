import { CheckCircle2, Search, Trash2 } from 'lucide-react'
import type { AutoExamConfigPanelProps } from './AutoExamConfigTypes'

export default function AutoExamManualQuestionPicker(props: AutoExamConfigPanelProps) {
  return (
    <div className="space-y-4 p-5 bg-gray-50 border border-gray-100 rounded-xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Chọn Câu Hỏi Từ Ngân Hàng</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Đã chọn {props.selectedQuestions.length} câu. Có thể bỏ chọn trước khi sinh đề.
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-3.5 py-2 flex items-center gap-2 text-sm w-full sm:w-72">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Tìm nội dung câu hỏi..."
            value={props.questionSearch}
            onChange={(e) => props.setQuestionSearch(e.target.value)}
            className="bg-transparent focus:outline-none text-gray-800 w-full placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-xl bg-white">
        {props.filteredEligibleQuestions.map((question) => {
          const isSelected = props.selectedQuestionIds.includes(question.id)

          return (
            <button
              key={question.id}
              type="button"
              onClick={() => props.toggleQuestionSelection(question.id)}
              className={`w-full text-left p-4 flex items-start gap-3.5 hover:bg-blue-50/50 transition-colors ${
                isSelected ? 'bg-blue-50/70' : ''
              }`}
            >
              <span
                className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-300 text-transparent'
                }`}
              >
                <CheckCircle2 size={15} />
              </span>
              <span className="flex-1 space-y-1.5">
                <span className="block text-sm font-semibold text-gray-900 line-clamp-2">
                  {question.content}
                </span>
                <span className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-md">
                    {question.difficulty}
                  </span>
                  <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-100">
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
              className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:text-rose-600 hover:border-rose-200 rounded-xl text-sm font-medium flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <span>{question.id}</span>
              <Trash2 size={14} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
