import AppSelect from '../../../../../components/common/AppSelect'
import type { AutoExamConfigPanelProps } from '../../../types/auto-exam-config.types'
import { NumberField } from './AutoExamConfigControls'

export default function AutoExamBaseConfig(props: AutoExamConfigPanelProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
        Cấu Hình Đề Thi
      </h3>

      <div className="border border-gray-100 rounded-2xl p-5 bg-white space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Tên Bài Thi / Đợt Thi:</label>
            <input
              type="text"
              value={props.examTitle}
              onChange={(e) => props.setExamTitle(e.target.value)}
              className="w-full bg-gray-50/70 border border-gray-200 text-sm font-medium rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 text-gray-900 shadow-2xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Loại Bài Thi:</label>
            <AppSelect
              value={props.examCategory}
              onChange={props.setExamCategory}
              buttonClassName="bg-gray-50/70 py-2.5 text-sm rounded-xl border border-gray-200 shadow-2xs"
              options={[
                { value: 'QUIZ', label: 'Quiz / Kiểm tra thường kỳ' },
                { value: 'MIDTERM', label: 'Giữa kỳ' },
                { value: 'FINAL', label: 'Cuối kỳ' },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Môn Học Học Phần:</label>
            <AppSelect
              value={props.selectedSubject}
              onChange={props.onSubjectChange}
              buttonClassName="bg-gray-50/70 py-2.5 text-sm rounded-xl border border-gray-200 shadow-2xs"
              options={props.subjectOptions.map((subject) => ({ value: subject.id, label: subject.name }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Hình Thức Đề Thi:</label>
            <AppSelect
              value={props.examFormat}
              onChange={props.setExamFormat}
              buttonClassName="bg-gray-50/70 py-2.5 text-sm rounded-xl border border-gray-200 shadow-2xs"
              options={[
                { value: 'OBJECTIVE', label: 'Trắc nghiệm (1 đáp án, nhiều đáp án, đúng/sai)' },
                { value: 'PROGRAMMING', label: 'Lập trình (Code / TestCase)' },
                { value: 'MIXED', label: 'Hỗn hợp (Trắc nghiệm + Lập trình)' },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumberField
            label="Thời lượng mặc định"
            value={props.durationMinutes}
            onChange={props.setDurationMinutes}
            suffix="phút"
          />
          <NumberField
            label="Tổng điểm mục tiêu"
            value={props.targetTotalPoints}
            onChange={props.setTargetTotalPoints}
          />
        </div>
      </div>
    </div>
  )
}
