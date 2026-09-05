import AppSelect from '../../../../../components/common/AppSelect'
import type { AutoExamConfigPanelProps } from '../../../types/auto-exam-config.types'
import { NumberField } from './AutoExamConfigControls'

export default function AutoExamBaseConfig(props: AutoExamConfigPanelProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
        Cấu Hình Đề Thi
      </h3>

      <div className="border border-gray-100 rounded-2xl p-5 bg-white space-y-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Tên Bài Thi / Đợt Thi:</label>
            <input
              type="text"
              value={props.examTitle}
              placeholder="Ví dụ: Đề thi Giữa Kỳ 1..."
              onChange={(e) => {
                props.onFieldChange?.('examTitle')
                props.setExamTitle(e.target.value)
              }}
              className="w-full bg-white border border-gray-200 text-sm font-medium rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 text-gray-900 shadow-2xs"
            />
            {props.fieldErrors?.examTitle && (
              <p className="text-xs text-rose-600 mt-1">{props.fieldErrors.examTitle}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Loại Bài Thi:</label>
            <AppSelect
              value={props.examCategory}
              onChange={(value) => {
                props.onFieldChange?.('examCategory')
                props.setExamCategory(value)
              }}
              buttonClassName="bg-white py-2.5 text-sm rounded-xl border border-gray-200 shadow-2xs"
              options={[
                { value: 'QUIZ', label: 'Quiz / Kiểm tra thường kỳ' },
                { value: 'MIDTERM', label: 'Giữa kỳ' },
                { value: 'FINAL', label: 'Cuối kỳ' },
              ]}
            />
            {props.fieldErrors?.examCategory && (
              <p className="text-xs text-rose-600 mt-1">{props.fieldErrors.examCategory}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Môn Học Học Phần:</label>
            <AppSelect
              value={props.selectedSubject}
              onChange={(value) => {
                props.onFieldChange?.('selectedSubject')
                props.onSubjectChange(value)
              }}
              buttonClassName="bg-white py-2.5 text-sm rounded-xl border border-gray-200 shadow-2xs"
              options={props.subjectOptions.map((subject) => ({ value: subject.id, label: subject.name }))}
            />
            {props.fieldErrors?.selectedSubject && (
              <p className="text-xs text-rose-600 mt-1">{props.fieldErrors.selectedSubject}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Hình Thức Đề Thi:</label>
            <AppSelect
              value={props.examFormat}
              onChange={(value) => {
                props.onFieldChange?.('examFormat')
                props.setExamFormat(value)
              }}
              buttonClassName="bg-white py-2.5 text-sm rounded-xl border border-gray-200 shadow-2xs"
              options={[
                { value: 'OBJECTIVE', label: 'Trắc nghiệm (1 đáp án, nhiều đáp án, đúng/sai)' },
                { value: 'PROGRAMMING', label: 'Lập trình (Code / TestCase)' },
                { value: 'MIXED', label: 'Hỗn hợp (Trắc nghiệm + Lập trình)' },
              ]}
            />
            {props.fieldErrors?.examFormat && (
              <p className="text-xs text-rose-600 mt-1">{props.fieldErrors.examFormat}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumberField
            label="Thời lượng mặc định"
            value={props.durationMinutes}
            placeholder="Nhập số phút..."
            onChange={(val) => {
              props.onFieldChange?.('durationMinutes')
              props.setDurationMinutes(val)
            }}
            suffix="phút"
            error={props.fieldErrors?.durationMinutes}
          />
          <NumberField
            label="Tổng điểm mục tiêu"
            value={props.targetTotalPoints}
            onChange={(val) => {
              props.onFieldChange?.('targetTotalPoints')
              props.setTargetTotalPoints(val)
            }}
            error={props.fieldErrors?.targetTotalPoints}
          />
        </div>
      </div>
    </div>
  )
}
