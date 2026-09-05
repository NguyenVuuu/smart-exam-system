import { Database, ListChecks, Plus, Sparkles } from 'lucide-react'
import type { ExamQuestionItem, ExamSection, ExamType } from '../../../types/teacher-exam.types'
import type { Question } from '../../../types/teacher-question-bank.types'
import { StepCard } from '../ExamEditorPrimitives'
import { QuestionRow } from '../QuestionRow'
import type { ApiFieldErrors } from '../../../../../api/errors'

export function StepQuestions(props: {
  sections: ExamSection[]
  sectionStats: Array<ExamSection & { questionCount: number; points: number }>
  activeSectionId: string
  setActiveSectionId: (value: string) => void
  visibleQuestions: ExamQuestionItem[]
  questions: ExamQuestionItem[]
  setQuestions: (value: ExamQuestionItem[]) => void
  collapsedQuestionIds: string[]
  onToggleQuestionCollapse: (value: string) => void
  openBank: () => void
  openManual: () => void
  openAi: () => void
  examType: ExamType
  onEdit: (question: Question) => void
  fieldErrors?: ApiFieldErrors
  onFieldChange?: (field: string) => void
}) {
  const updateQuestionPoints = (index: number, points: number) => {
    props.onFieldChange?.('items')
    const updated = [...props.questions]
    updated[index] = { ...updated[index], points }
    props.setQuestions(updated)
  }

  const updateQuestionSection = (questionId: string, sectionId: string) => {
    const updated = props.questions.map((item) =>
      item.questionId === questionId ? { ...item, sectionId } : item,
    )
    props.setQuestions(updated)
  }

  return (
    <StepCard
      title="Danh sách câu hỏi"
      desc="Thêm câu hỏi từ ngân hàng, tự nhập thủ công hoặc trích xuất từ AI."
      icon={<ListChecks size={18} className="text-blue-600" />}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {props.sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => props.setActiveSectionId(section.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  props.activeSectionId === section.id
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                {section.title}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={props.openBank}
              className="px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Database size={15} /> Thêm từ ngân hàng
            </button>

            <button
              type="button"
              onClick={props.openAi}
              className="px-3 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-purple-200"
            >
              <Sparkles size={15} className="text-purple-600" /> AI bóc tách đề
            </button>

            <button
              type="button"
              onClick={props.openManual}
              className="px-3 py-2 bg-gray-900 hover:bg-black text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Plus size={15} /> Soạn câu hỏi mới
            </button>
          </div>
        </div>

        <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
          {props.visibleQuestions.map((item, sectionIndex) => {
            const globalIndex = props.questions.findIndex((q) => q.questionId === item.questionId)
            return (
              <QuestionRow
                key={item.questionId}
                item={item}
                index={sectionIndex}
                sections={props.sections}
                isCollapsed={props.collapsedQuestionIds.includes(item.questionId)}
                onToggleCollapse={() => props.onToggleQuestionCollapse(item.questionId)}
                onPointChange={(points) => updateQuestionPoints(globalIndex, points)}
                onSectionChange={(sectionId) => updateQuestionSection(item.questionId, sectionId)}
                onEdit={() => props.onEdit(item.question)}
                onRemove={() => {
                  props.setQuestions(props.questions.filter((q) => q.questionId !== item.questionId))
                }}
              />
            )
          })}

          {props.visibleQuestions.length === 0 && (
            <div className="p-8 text-center border border-dashed border-gray-200 rounded-xl text-xs text-gray-400">
              Chưa có câu hỏi nào trong phần thi này. Chọn một nguồn bên trên để thêm câu hỏi.
            </div>
          )}
        </div>
      </div>
    </StepCard>
  )
}
