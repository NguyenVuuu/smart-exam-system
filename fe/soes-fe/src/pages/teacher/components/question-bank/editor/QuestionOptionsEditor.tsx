import { Plus, Trash2 } from 'lucide-react'
import type { QuestionOption, QuestionType } from '../../../types/teacher-question-bank.types'

export function QuestionOptionsEditor({
  questionType,
  options,
  onOptionsChange,
}: {
  questionType: QuestionType
  options: QuestionOption[]
  onOptionsChange: (opts: QuestionOption[]) => void
}) {
  const isTrueFalse = questionType === 'TRUE_FALSE'
  const displayOptions = isTrueFalse ? options.slice(0, 2) : options

  const handleAddOption = () => {
    if (isTrueFalse) return
    onOptionsChange([
      ...options,
      { id: `opt-${Date.now()}`, content: `Phương án mới`, isCorrect: false },
    ])
  }

  const handleRemoveOption = (id: string) => {
    if (isTrueFalse || options.length <= 2) {
      alert('Câu hỏi trắc nghiệm cần ít nhất 2 phương án.')
      return
    }
    onOptionsChange(options.filter((opt) => opt.id !== id))
  }

  const handleOptionContentChange = (id: string, text: string) => {
    onOptionsChange(options.map((opt) => (opt.id === id ? { ...opt, content: text } : opt)))
  }

  const handleToggleCorrect = (id: string) => {
    if (questionType === 'SINGLE_CHOICE' || isTrueFalse) {
      onOptionsChange(options.map((opt) => ({ ...opt, isCorrect: opt.id === id })))
    } else {
      onOptionsChange(options.map((opt) => (opt.id === id ? { ...opt, isCorrect: !opt.isCorrect } : opt)))
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-gray-700">
          {isTrueFalse ? 'Chọn Đáp Án Đúng (Đúng hoặc Sai) *' : 'Danh Sách Phương Án Trả Lời *'}
        </label>
        {!isTrueFalse && (
          <button
            type="button"
            onClick={handleAddOption}
            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus size={13} /> Thêm phương án
          </button>
        )}
      </div>

      <div className="space-y-2">
        {displayOptions.map((opt, idx) => {
          const letter = String.fromCharCode(65 + idx)
          return (
            <div
              key={opt.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                opt.isCorrect
                  ? 'border-emerald-500 bg-emerald-50/40'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <button
                type="button"
                onClick={() => handleToggleCorrect(opt.id)}
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all cursor-pointer ${
                  opt.isCorrect
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
                title={opt.isCorrect ? 'Đáp án đúng' : 'Đánh dấu là đáp án đúng'}
              >
                {letter}
              </button>

              <input
                type="text"
                value={opt.content}
                onChange={(e) => handleOptionContentChange(opt.id, e.target.value)}
                placeholder={isTrueFalse ? (idx === 0 ? 'Đúng' : 'Sai') : `Nội dung phương án ${letter}...`}
                className="flex-1 bg-transparent border-none text-xs text-gray-800 font-medium focus:outline-none focus:ring-0 p-0"
              />

              {!isTrueFalse && options.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemoveOption(opt.id)}
                  className="p-1 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
