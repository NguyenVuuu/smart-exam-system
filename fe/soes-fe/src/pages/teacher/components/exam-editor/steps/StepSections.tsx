import { Layers, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { ExamQuestionItem, ExamSection, ExamType } from '../../../types/teacher-exam.types'
import { balanceQuestionPointsBySection, createExamSectionId } from '../../../utils/ExamEditorUtils'
import { StepCard } from '../ExamEditorPrimitives'

export function StepSections({
  examType,
  sections,
  setSections,
  activeSectionId,
  setActiveSectionId,
  questions,
  setQuestions,
}: {
  examType: ExamType
  sections: ExamSection[]
  setSections: (value: ExamSection[]) => void
  activeSectionId: string
  setActiveSectionId: (value: string) => void
  questions: ExamQuestionItem[]
  setQuestions: (value: ExamQuestionItem[]) => void
}) {
  const sectionTypeLabel = {
    OBJECTIVE: 'Trắc nghiệm',
    PROGRAMMING: 'Lập trình',
  }

  const addSection = (type: ExamSection['type']) => {
    const nextOrder = sections.length + 1
    const sectionConfig = {
      OBJECTIVE: {
        title: `Phần ${nextOrder}: Trắc nghiệm`,
        description: 'Câu trắc nghiệm, có thể chấm tự động.',
        targetPoints: 5,
      },
      PROGRAMMING: {
        title: `Phần ${nextOrder}: Lập trình`,
        description: 'Câu code console có test case.',
        targetPoints: 5,
      },
    }[type]

    const newSection: ExamSection = {
      id: createExamSectionId(type),
      type,
      order: nextOrder,
      ...sectionConfig,
    }

    setSections([...sections, newSection])
    setActiveSectionId(newSection.id)
  }

  const removeSection = (sectionId: string) => {
    if (sections.length <= 1) {
      toast.error('Đề thi phải có ít nhất một phần thi.')
      return
    }

    const fallbackSection = sections.find((item) => item.id !== sectionId)
    if (!fallbackSection) return

    const nextSections = sections
      .filter((item) => item.id !== sectionId)
      .map((item, index) => ({ ...item, order: index + 1 }))

    const nextQuestions = questions.map((item) =>
      item.sectionId === sectionId ? { ...item, sectionId: fallbackSection.id } : item,
    )

    setSections(nextSections)
    setActiveSectionId(fallbackSection.id)
    setQuestions(balanceQuestionPointsBySection(nextQuestions, nextSections))
  }

  const updateSectionPoints = (sectionId: string, targetPoints: number) => {
    const nextSections = sections.map((section) =>
      section.id === sectionId ? { ...section, targetPoints: Math.max(0, targetPoints) } : section,
    )
    setSections(nextSections)
    setQuestions(balanceQuestionPointsBySection(questions, nextSections))
  }

  return (
    <StepCard
      title="Cấu trúc phần thi"
      desc="Phân chia đề thành nhiều phần để dễ quản lý mục tiêu điểm và dạng câu hỏi."
      icon={<Layers size={18} className="text-blue-600" />}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {examType !== 'PROGRAMMING' && (
            <button
              type="button"
              onClick={() => addSection('OBJECTIVE')}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Plus size={14} /> Thêm phần trắc nghiệm
            </button>
          )}

          {examType !== 'MULTIPLE_CHOICE' && (
            <button
              type="button"
              onClick={() => addSection('PROGRAMMING')}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Plus size={14} /> Thêm phần lập trình
            </button>
          )}
        </div>

        <div className="space-y-3">
          {sections.map((section) => {
            const count = questions.filter((item) => item.sectionId === section.id).length
            const isSelected = section.id === activeSectionId

            return (
              <div
                key={section.id}
                onClick={() => setActiveSectionId(section.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">{section.title}</span>
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-700">
                        {sectionTypeLabel[section.type]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{section.description}</p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <label className="flex items-center gap-2 text-xs text-gray-500" onClick={(event) => event.stopPropagation()}>
                      <span>Điểm phần</span>
                      <input
                        type="number"
                        min={0}
                        step={0.25}
                        value={section.targetPoints ?? 0}
                        onChange={(event) => updateSectionPoints(section.id, Number(event.target.value))}
                        className="h-8 w-20 rounded-lg border border-gray-200 bg-white px-2 text-right text-sm font-normal text-gray-800 outline-none focus:border-blue-500"
                        aria-label={`Điểm mục tiêu ${section.title}`}
                      />
                    </label>
                    <span className="text-xs text-gray-500 font-medium">{count} câu hỏi</span>
                    {sections.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeSection(section.id)
                        }}
                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </StepCard>
  )
}
