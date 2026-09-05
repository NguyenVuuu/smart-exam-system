import { BookOpen } from 'lucide-react'
import AppSelect from '../../../../../components/common/AppSelect'
import type { ApiFieldErrors } from '../../../../../api/errors'
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
  semesterId: string
  setSemesterId: (value: string) => void
  semesterOptions: Array<{ value: string; label: string }>
  fieldErrors?: ApiFieldErrors
  onFieldChange?: (field: string) => void
}) {
  return (
    <StepCard
      title="Thông tin đề thi"
      desc="Khai báo đề thi trước. Sau khi tạo đề, giảng viên có thể tạo ca thi trong chi tiết đề."
      icon={<BookOpen size={18} className="text-blue-600" />}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="lg:col-span-2">
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
                      : 'border-gray-100 bg-white text-gray-700 hover:bg-gray-50'
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
        </div>

        <Field label="Học kỳ" error={props.fieldErrors?.semesterId}>
          <AppSelect
            value={props.semesterId}
            onChange={(value) => { props.onFieldChange?.('semesterId'); props.setSemesterId(value) }}
            buttonClassName="bg-white"
            options={props.semesterOptions}
          />
        </Field>

        <Field label="Tên đề thi" error={props.fieldErrors?.title}>
          <input
            value={props.title}
            onChange={(e) => { props.onFieldChange?.('title'); props.setTitle(e.target.value) }}
            placeholder="Ví dụ: Đề thi Giữa Kỳ 1..."
            className="w-full bg-white border border-gray-200 text-xs rounded-xl p-2.5 focus:outline-none focus:border-blue-500 font-medium shadow-2xs"
          />
        </Field>

        <Field label="Môn học" error={props.fieldErrors?.subjectId}>
          <AppSelect
            value={props.subjectId}
            onChange={(value) => { props.onFieldChange?.('subjectId'); props.setSubjectId(value) }}
            buttonClassName="bg-white"
            options={props.subjectOptions}
          />
        </Field>

        <Field label="Loại bài thi">
          <AppSelect
            value={props.examCategory}
            onChange={props.setExamCategory}
            buttonClassName="bg-white"
            options={[
              { value: 'QUIZ', label: 'Quiz / kiểm tra thường kỳ' },
              { value: 'MIDTERM', label: 'Giữa kỳ' },
              { value: 'FINAL', label: 'Cuối kỳ' },
            ]}
          />
        </Field>

        <div className="lg:col-span-2">
          <Field label="Mô tả nội dung kiểm tra" error={props.fieldErrors?.description}>
            <textarea
              rows={3}
              value={props.description}
              onChange={(e) => { props.onFieldChange?.('description'); props.setDescription(e.target.value) }}
              placeholder="Nhập mô tả đề thi..."
              className="w-full bg-white border border-gray-200 text-xs rounded-xl p-3 focus:outline-none focus:border-blue-500 shadow-2xs"
            />
          </Field>
        </div>
      </div>
    </StepCard>
  )
}
