import type { AutoExamConfigPanelProps } from '../../../types/auto-exam-config.types'
import { PickModeButton } from './AutoExamConfigControls'

export default function AutoExamQuestionPickModeConfig(props: AutoExamConfigPanelProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Cách Chọn Câu Hỏi</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PickModeButton
          active={props.pickMode === 'AUTO'}
          title="Tự động bốc theo tiêu chí độ khó"
          description="Hệ thống bốc ngẫu nhiên câu trắc nghiệm theo môn học và ma trận độ khó đã cấu hình bên dưới."
          onClick={() => props.setPickMode('AUTO')}
        />
        <PickModeButton
          active={props.pickMode === 'MANUAL'}
          title="Giảng viên tự chọn câu hỏi"
          description="Chọn trước câu hỏi từ ngân hàng môn học, sau đó hệ thống tạo đề thi từ danh sách đã chọn."
          onClick={() => props.setPickMode('MANUAL')}
        />
      </div>
    </div>
  )
}
