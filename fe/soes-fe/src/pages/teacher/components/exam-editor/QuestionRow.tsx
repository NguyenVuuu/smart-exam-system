import { Check, ChevronDown, ChevronUp, Code, Edit, Trash2 } from 'lucide-react'
import AppSelect from '../../../../components/common/AppSelect'
import type { ExamQuestionItem, ExamSection } from '../../types/teacher-exam.types'
import type { Question } from '../../types/teacher-question-bank.types'
import { questionTypeLabel } from '../../constants/ExamEditorConfig'

export function QuestionRow({
  item,
  index,
  sections,
  isCollapsed,
  onToggleCollapse,
  onPointChange,
  onSectionChange,
  onEdit,
  onRemove,
}: {
  item: ExamQuestionItem
  index: number
  sections: ExamSection[]
  isCollapsed: boolean
  onToggleCollapse: () => void
  onPointChange: (points: number) => void
  onSectionChange: (sectionId: string) => void
  onEdit: () => void
  onRemove: () => void
}) {
  if (isCollapsed) {
    return (
      <div className="px-4 py-3 rounded-xl border border-gray-100 bg-white hover:border-blue-100 transition-colors">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors shrink-0"
            title="Mở câu hỏi"
          >
            <ChevronDown size={15} />
          </button>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
            {index + 1}
          </div>
          <p className="min-w-0 flex-1 text-xs font-semibold text-gray-900 truncate">
            {item.question.content}
          </p>
          <span className="shrink-0 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700">
            {item.points} điểm
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 rounded-xl border border-gray-100 bg-white hover:border-blue-100 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
          {index + 1}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="mt-0.5 p-1 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Thu gọn câu hỏi"
            >
              <ChevronUp size={15} />
            </button>

            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-xs font-bold">
                  {questionTypeLabel[item.question.type]}
                </span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs font-bold">
                  {item.question.difficulty}
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-xs font-bold">
                  {item.question.bankScope === 'SHARED' ? 'Ngân hàng chung' : 'Cá nhân'}
                </span>
              </div>
              <p className="text-xs font-semibold text-gray-900 leading-relaxed">
                {item.question.content}
              </p>
              <QuestionAnswerPreview question={item.question} />
            </div>
          </div>
        </div>

        <div className="w-44 space-y-2 shrink-0">
          <AppSelect
            value={item.sectionId ?? ''}
            onChange={onSectionChange}
            buttonClassName="bg-gray-50 text-xs rounded-lg p-2"
            menuClassName="min-w-52"
            options={sections.map((section) => ({
              value: section.id,
              label: section.title,
            }))}
          />
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-600">
            Điểm
            <input
              type="number"
              min={0}
              step={0.25}
              value={item.points}
              onChange={(e) => onPointChange(Number(e.target.value))}
              className="w-20 bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-bold focus:outline-none focus:border-blue-300"
            />
          </label>
          <div className="flex justify-end gap-1">
            <button onClick={onEdit} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
              <Edit size={14} />
            </button>
            <button onClick={onRemove} className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function QuestionAnswerPreview({ question }: { question: Question }) {
  if (question.type === 'PROGRAMMING') {
    return (
      <p className="text-xs text-gray-500 flex items-center gap-1">
        <Code size={13} /> {question.programmingLanguage} • {question.testCases?.length || 0} test case
      </p>
    )
  }

  if (!question.options) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {question.options.map((opt) => (
        <div key={opt.id} className="flex items-center gap-2 text-xs text-gray-600">
          {opt.isCorrect && <Check size={14} className="text-emerald-600 shrink-0" />}
          <span>{opt.content}</span>
        </div>
      ))}
    </div>
  )
}
