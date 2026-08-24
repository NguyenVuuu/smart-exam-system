import { BookOpen, Clock, Database, Eye, Layers, ListChecks, Plus, Sparkles, Trash2 } from 'lucide-react'
import { MOCK_TEACHER_COURSES } from '../../mock/teacher-course.mock'
import type { ExamCategory, ExamQuestionItem, ExamSection, ExamType } from '../../types/teacher-exam.types'
import type { Question } from '../../types/teacher-question-bank.types'
import AppNumberInput from '../../../../components/common/AppNumberInput'
import AppSelect from '../../../../components/common/AppSelect'
import { examTypeDescription, examTypeLabel } from '../../constants/ExamEditorConfig'
import { balanceQuestionPointsBySection } from '../../utils/ExamEditorUtils'
import { Field, StepCard, SummaryBox } from './ExamEditorPrimitives'
import { QuestionAnswerPreview, QuestionRow } from './QuestionRow'

let sectionIdSequence = 0

export function StepInfo(props: {
  title: string
  setTitle: (value: string) => void
  description: string
  setDescription: (value: string) => void
  examCategory: ExamCategory
  setExamCategory: (value: ExamCategory) => void
  examType: ExamType
  updateExamType: (value: ExamType) => void
  subjectId: string
  setSubjectId: (value: string) => void
}) {
  const subjectOptions = Array.from(
    new Map(
      MOCK_TEACHER_COURSES.map((course) => [
        course.subjectName,
        { value: course.subjectName, label: course.subjectName },
      ]),
    ).values(),
  )

  return (
    <StepCard
      title="Thông tin đề thi"
      desc="Khai báo đề thi trước. Sau khi tạo đề, giảng viên có thể tạo ca thi trong chi tiết đề."
      icon={<BookOpen size={18} className="text-blue-600" />}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Field label="Loại đề thi">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {(['MULTIPLE_CHOICE', 'PROGRAMMING', 'MIXED'] as ExamType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => props.updateExamType(type)}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  props.examType === type
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-100 bg-gray-50 text-gray-700 hover:bg-white'
                }`}
              >
                <span className="text-xs font-bold block">{examTypeLabel[type]}</span>
                <span className="text-xs text-gray-500 mt-1 block leading-relaxed">
                  {examTypeDescription[type]}
                </span>
              </button>
            ))}
          </div>
        </Field>

        <Field label="Loại bài thi">
          <AppSelect
            value={props.examCategory}
            onChange={props.setExamCategory}
            buttonClassName="bg-gray-50"
            options={[
              { value: 'QUIZ', label: 'Quiz / kiểm tra thường kỳ' },
              { value: 'MIDTERM', label: 'Giữa kỳ' },
              { value: 'FINAL', label: 'Cuối kỳ' },
            ]}
          />
        </Field>

        <Field label="Tên đề thi">
          <input
            value={props.title}
            onChange={(e) => props.setTitle(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 focus:outline-none focus:border-blue-500 font-medium"
          />
        </Field>

        <Field label="Môn học">
          <AppSelect
            value={props.subjectId}
            onChange={props.setSubjectId}
            buttonClassName="bg-gray-50"
            options={subjectOptions}
          />
        </Field>

        <div className="lg:col-span-2">
          <Field label="Mô tả nội dung kiểm tra">
            <textarea
              rows={3}
              value={props.description}
              onChange={(e) => props.setDescription(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-3 focus:outline-none focus:border-blue-500"
            />
          </Field>
        </div>
      </div>
    </StepCard>
  )
}

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
      id: `sec-${type.toLowerCase()}-${++sectionIdSequence}`,
      type,
      order: nextOrder,
      ...sectionConfig,
    }

    setSections([...sections, newSection])
    setActiveSectionId(newSection.id)
  }

  const removeSection = (sectionId: string) => {
    if (sections.length <= 1) {
      alert('Đề thi phải có ít nhất một phần thi.')
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
                  isSelected ? 'border-blue-500 bg-blue-50/50 shadow-xs' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">{section.title}</span>
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-700">
                        {sectionTypeLabel[section.type]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{section.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
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
}) {
  const updateQuestionPoints = (index: number, points: number) => {
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
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
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
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Database size={14} /> Chọn từ ngân hàng
            </button>
            <button
              type="button"
              onClick={props.openManual}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Plus size={14} /> Tạo câu hỏi mới
            </button>
            {props.examType !== 'PROGRAMMING' && (
              <button
                type="button"
                onClick={props.openAi}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Sparkles size={14} /> AI sinh từ PDF
              </button>
            )}
          </div>
        </div>

        {props.visibleQuestions.length === 0 ? (
          <div className="border border-dashed border-gray-200 rounded-xl py-10 text-center">
            <p className="text-xs font-bold text-gray-700">Chưa có câu hỏi trong phần này</p>
            <p className="text-xs text-gray-500 mt-1">Chọn từ ngân hàng hoặc tạo câu mới để bắt đầu.</p>
          </div>
        ) : (
          props.visibleQuestions.map((item) => {
            const globalIndex = props.questions.findIndex((q) => q.questionId === item.questionId)
            return (
              <QuestionRow
                key={item.questionId}
                item={item}
                index={globalIndex}
                sections={props.sections}
                isCollapsed={props.collapsedQuestionIds.includes(item.questionId)}
                onToggleCollapse={() => props.onToggleQuestionCollapse(item.questionId)}
                onPointChange={(points) => updateQuestionPoints(globalIndex, points)}
                onSectionChange={(sectionId) => updateQuestionSection(item.questionId, sectionId)}
                onEdit={() => props.onEdit(item.question)}
                onRemove={() =>
                  props.setQuestions(
                    balanceQuestionPointsBySection(
                      props.questions.filter((q) => q.questionId !== item.questionId),
                      props.sections,
                      [item.sectionId ?? props.activeSectionId],
                    ),
                  )
                }
              />
            )
          })
        )}
      </div>
    </StepCard>
  )
}

export function StepConfig(props: {
  durationMinutes: number
  setDurationMinutes: (value: number) => void
  targetTotalPoints: number
  setTargetTotalPoints: (value: number) => void
}) {
  return (
    <StepCard
      title="Cấu hình đề thi"
      desc="Thiết lập điểm mục tiêu và thời lượng mặc định của đề thi."
      icon={<Clock size={18} className="text-blue-600" />}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Field label="Thời lượng mặc định">
          <AppNumberInput
            value={props.durationMinutes}
            onChange={props.setDurationMinutes}
            suffix="phút"
          />
        </Field>

        <Field label="Tổng điểm mục tiêu">
          <AppNumberInput
            step={0.5}
            value={props.targetTotalPoints}
            onChange={props.setTargetTotalPoints}
          />
        </Field>
      </div>
    </StepCard>
  )
}

export function StepPreview({
  examType,
  title,
  description,
  sectionStats,
  questions,
}: {
  examType: ExamType
  title: string
  description: string
  sectionStats: Array<ExamSection & { questionCount: number; points: number }>
  questions: ExamQuestionItem[]
}) {
  const getVariantQuestions = (sectionId: string) => {
    return questions.filter((item) => item.sectionId === sectionId)
  }

  return (
    <StepCard
      title="Xem trước đề thi"
      desc="Kiểm tra nội dung đề và thứ tự câu hỏi trước khi tạo ca thi."
      icon={<Eye size={18} className="text-blue-600" />}
    >
      <div className="space-y-4">
        <div className="border-b border-gray-100 pb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase">{examTypeLabel[examType]}</p>
            <h2 className="text-xs font-semibold text-gray-900 mt-1">{title}</h2>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          </div>
          <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium shrink-0">
            Xem thử đề cá nhân
          </span>
        </div>

        {sectionStats.map((section) => (
          <div key={section.id} className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-900">{section.title}</p>
                <p className="text-xs text-gray-500">{section.description}</p>
              </div>
              <span className="text-xs font-bold text-blue-700">
                {section.questionCount} câu • {section.points.toFixed(1)} điểm
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {getVariantQuestions(section.id).map((item, idx) => (
                <div key={item.questionId} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-semibold text-gray-900 leading-relaxed">
                      Câu {idx + 1}. {item.question.content}
                    </p>
                    <span className="text-xs font-bold text-gray-700 shrink-0">{item.points} điểm</span>
                  </div>
                  <QuestionAnswerPreview question={item.question} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </StepCard>
  )
}

export function ExamSummary({
  examType,
  title,
  selectedSubject,
  sections,
  sectionStats,
  questions,
  totalPoints,
  onAutoBalancePoints,
}: {
  examType: ExamType
  title: string
  selectedSubject: { subjectCode: string; subjectName: string }
  sections: ExamSection[]
  sectionStats: Array<ExamSection & { questionCount: number; points: number }>
  questions: ExamQuestionItem[]
  totalPoints: number
  onAutoBalancePoints?: () => void
}) {
  const isPointsBalanced = Math.abs(totalPoints - 10) < 0.01

  return (
    <aside className="w-full xl:w-[360px] space-y-4 h-fit xl:sticky xl:top-6 font-sans">
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-4">
        <div>
          <p className="text-xs font-bold uppercase text-blue-600 tracking-wide">{examTypeLabel[examType]}</p>
          <h2 className="text-xs font-bold text-gray-900 mt-1 leading-snug">{title}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {selectedSubject.subjectCode} • {selectedSubject.subjectName}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <SummaryBox label="Phần thi" value={sections.length} />
          <SummaryBox label="Câu hỏi" value={questions.length} />
          <div className={`rounded-xl border p-2.5 text-center ${isPointsBalanced ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50/50 border-amber-200'}`}>
            <span className="text-xs text-gray-500 block font-medium">Tổng điểm</span>
            <span className={`text-xs font-bold ${isPointsBalanced ? 'text-emerald-700' : 'text-amber-700'}`}>
              {totalPoints.toFixed(1)}/10
            </span>
          </div>
        </div>

        {!isPointsBalanced && questions.length > 0 && onAutoBalancePoints && (
          <button
            type="button"
            onClick={onAutoBalancePoints}
            className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
          >
            ⚡ Tự động chia đều cho tròn 10.0đ
          </button>
        )}

        <div className="border-t border-gray-100 pt-3 space-y-2">
          <span className="text-xs font-bold text-gray-700 block">Cơ cấu điểm theo phần:</span>
          {sectionStats.map((section) => (
            <div key={section.id} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-gray-50/80">
              <span className="text-gray-700 font-medium truncate max-w-[180px]">{section.title}</span>
              <span className="font-bold text-blue-700 shrink-0">
                {section.questionCount} câu • {section.points.toFixed(1)}đ
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
