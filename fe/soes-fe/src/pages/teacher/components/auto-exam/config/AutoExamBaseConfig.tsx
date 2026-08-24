import { Clock } from 'lucide-react'
import AppSelect from '../../../../../components/common/AppSelect'
import type { AutoExamConfigPanelProps } from './AutoExamConfigTypes'
import { NumberField } from './AutoExamConfigControls'

export default function AutoExamBaseConfig(props: AutoExamConfigPanelProps) {
  return (
    <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-4">
      <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
        <Clock size={15} className="text-blue-600" />
        Cấu Hình Đề Thi
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700">Tên Bài Thi / Đợt Thi:</label>
          <input
            type="text"
            value={props.examTitle}
            onChange={(e) => props.setExamTitle(e.target.value)}
            className="w-full bg-white border border-gray-200 text-xs font-medium rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700">Loại Bài Thi:</label>
          <AppSelect
            value={props.examCategory}
            onChange={props.setExamCategory}
            options={[
              { value: 'QUIZ', label: 'Quiz / Kiểm tra thường kỳ' },
              { value: 'MIDTERM', label: 'Giữa kỳ' },
              { value: 'FINAL', label: 'Cuối kỳ' },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700">Môn Học Học Phần:</label>
          <AppSelect
            value={props.selectedSubject}
            onChange={props.onSubjectChange}
            buttonClassName="bg-white"
            options={[
              { value: 'sub-01', label: 'Lập trình Java căn bản (CS101)' },
              { value: 'sub-02', label: 'Cấu trúc dữ liệu & Giải thuật (CS102)' },
              { value: 'sub-03', label: 'Lập trình C++ (CS103)' },
            ]}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700">Trạng Thái Bộ Đề:</label>
          <div className="w-full bg-white border border-gray-200 text-xs rounded-xl px-3 py-2.5 text-gray-700">
            {props.draftStatus === 'SAVED_DRAFT'
              ? 'Đã lưu nháp (DRAFT)'
              : props.draftStatus === 'GENERATED'
              ? 'Đã sinh đề - chưa lưu'
              : 'Chưa sinh đề'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <NumberField
          label="Thời lượng mặc định"
          value={props.durationMinutes}
          onChange={props.setDurationMinutes}
          suffix="phút"
        />
        <NumberField label="Tổng điểm mục tiêu" value={props.targetTotalPoints} onChange={props.setTargetTotalPoints} />
      </div>
    </div>
  )
}
