import { BookOpen } from 'lucide-react'
import AppSelect from '../../../../../components/common/AppSelect'
import { examTypeDescription, examTypeLabel } from '../../../constants/ExamEditorConfig'
import type { ExamCategory, ExamType } from '../../../types/teacher-exam.types'
import { Field, StepCard } from '../ExamEditorPrimitives'

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
  subjectOptions: Array<{ value: string; label: string }>
}) {
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
            options={props.subjectOptions}
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
