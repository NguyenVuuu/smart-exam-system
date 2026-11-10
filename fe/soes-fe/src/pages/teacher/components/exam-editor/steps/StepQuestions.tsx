import { Database, ListChecks, Plus, Sparkles } from 'lucide-react'
import type { ExamQuestionItem, ExamSection, ExamType } from '../../../types/teacher-exam.types'
import type { Question } from '../../../types/teacher-question-bank.types'
import { StepCard } from '../ExamEditorPrimitives'
import { QuestionRow } from '../QuestionRow'
import type { ApiFieldErrors } from '../../../../../api/errors'
import { normalizePoint } from '../../../utils/ExamEditorUtils'
import { useQuestionDrag } from '../useQuestionDrag'

export function StepQuestions(props: {
  sections: ExamSection[]
  sectionStats: Array<ExamSection & { questionCount: number; points: number }>
  activeSectionId: string
  setActiveSectionId: (value: string) => void
  visibleQuestions: ExamQuestionItem[]
  revisionNotes: Map<string, string>
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
  const drag = useQuestionDrag({
    questions: props.questions,
    sections: props.sections,
    setQuestions: props.setQuestions,
    setActiveSectionId: props.setActiveSectionId,
  })

  const updateQuestionPoints = (index: number, points: number) => {
    props.onFieldChange?.('items')
    const updated = [...props.questions]
    updated[index] = { ...updated[index], points: normalizePoint(points) }
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
            {props.sections.map((section) => {
              const noteCount = props.questions.filter((item) => item.sectionId === section.id
                && item.snapshotQuestionId && props.revisionNotes.has(item.snapshotQuestionId)).length
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => props.setActiveSectionId(section.id)}
                  onDragOver={(event) => drag.dragOverSection(event, section.id)}
                  onDrop={(event) => drag.dropOnSection(event, section.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    drag.dropTarget?.sectionId === section.id && !drag.dropTarget.questionId
                      ? 'border-blue-500 bg-blue-100 text-blue-900 ring-2 ring-blue-200'
                      : props.activeSectionId === section.id
                      ? 'border-blue-500 bg-blue-50 text-blue-800'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {section.title}
                  {noteCount > 0 && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">{noteCount} góp ý</span>}
                </button>
              )
            })}
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

        {props.visibleQuestions.length > 0 && (
          <p className="text-xs text-gray-500">Kéo và thả vào bất kỳ vị trí nào trên card câu hỏi khác để đổi thứ tự; thả lên tab để chuyển phần thi.</p>
        )}
        <div className="space-y-3">
          {props.visibleQuestions.map((item, sectionIndex) => {
            const globalIndex = props.questions.findIndex((q) => q.questionId === item.questionId)
            return (
              <div
                key={item.questionId}
                draggable
                tabIndex={0}
                role="group"
                aria-label={`Câu ${sectionIndex + 1}. Kéo để đổi thứ tự hoặc nhấn mũi tên lên, xuống`}
                className={`relative cursor-grab rounded-xl focus:outline-none focus:ring-inset focus:ring-2 focus:ring-blue-500 active:cursor-grabbing ${drag.draggedQuestionId === item.questionId ? 'opacity-50' : ''} ${drag.dropTarget?.questionId === item.questionId ? 'ring-inset ring-2 ring-blue-500 bg-blue-50' : ''}`}
                onPointerDownCapture={drag.prepareDrag}
                onPointerUpCapture={(event) => { event.currentTarget.draggable = true }}
                onDragStart={(event) => drag.startDrag(event, item.questionId)}
                onDragEnd={(event) => { event.currentTarget.draggable = true; drag.clearDrag() }}
                onDragOver={(event) => drag.dragOverQuestion(event, item)}
                onDrop={(event) => drag.dropOnQuestion(event, item)}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return
                  event.preventDefault()
                  drag.moveWithKeyboard(item.questionId, event.key === 'ArrowUp' ? -1 : 1)
                }}
              >
                <QuestionRow
                  item={item}
                  revisionNote={item.snapshotQuestionId ? props.revisionNotes.get(item.snapshotQuestionId) : undefined}
                  index={sectionIndex}
                  sections={props.sections}
                  isCollapsed={props.collapsedQuestionIds.includes(item.questionId)}
                  onToggleCollapse={() => props.onToggleQuestionCollapse(item.questionId)}
                  onPointChange={(points) => updateQuestionPoints(globalIndex, points)}
                  onSectionChange={(sectionId) => updateQuestionSection(item.questionId, sectionId)}
                  onEdit={() => props.onEdit(item.question)}
                  onRemove={() => props.setQuestions(props.questions.filter((question) => question.questionId !== item.questionId))}
                />
              </div>
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
