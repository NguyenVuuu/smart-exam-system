import { Clock, FileText, X } from 'lucide-react'
import { MOCK_AI_HISTORY } from '../../mock/teacher-question-bank.mock'

interface AIGenerationHistoryModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AIGenerationHistoryModal({ isOpen, onClose }: AIGenerationHistoryModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Clock size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Lịch Sử Sinh Câu Hỏi Bằng AI</h3>
              <p className="text-[11px] text-gray-500">Lưu lại thông tin giáo viên, tệp tài liệu, prompt và số lượng câu đã tạo</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {MOCK_AI_HISTORY.map((item) => (
            <div key={item.id} className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900">{item.courseCode}</span>
                <span className="text-[10px] text-gray-400">{item.generatedAt}</span>
              </div>

              <p className="text-xs text-gray-700 font-medium">Prompt: "{item.prompt}"</p>

              <div className="flex flex-wrap gap-2 text-[10px] text-gray-500">
                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-semibold">Model: {item.aiModel}</span>
                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-semibold">Đã sinh: {item.questionCount} câu</span>
                <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-semibold">Approved: {item.approvedCount} câu</span>
              </div>

              <div className="pt-2 border-t border-gray-200/60 flex items-center gap-1.5 text-[11px] text-gray-500">
                <FileText size={14} className="text-blue-600" />
                <span>Tài liệu: {item.materialsUsed.join(', ')}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-xl">
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
