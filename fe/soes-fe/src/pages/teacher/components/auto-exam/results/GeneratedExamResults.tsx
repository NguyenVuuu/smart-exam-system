import { Eye, FileCheck, Send } from 'lucide-react'
import type { AutoExamDraftStatus, GeneratedExamCode } from '../../../types/teacher-auto-exam.types'

export default function GeneratedExamResults({
  generatedExams,
  draftStatus,
  onSaveDraft,
  onPublish,
  onPreview,
}: {
  generatedExams: GeneratedExamCode[]
  draftStatus: AutoExamDraftStatus
  onSaveDraft: () => void
  onPublish: () => void
  onPreview: (exam: GeneratedExamCode) => void
}) {
  if (generatedExams.length === 0) return null

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <FileCheck size={18} className="text-blue-600" />
          Kết Quả Sinh Đề
        </h2>

        <div className="flex items-center gap-2">
          <button
            onClick={onSaveDraft}
            className="px-4 py-2 bg-gray-900 hover:bg-black text-white font-medium text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <FileCheck size={15} /> Lưu Nháp Đề
          </button>

          <button
            onClick={onPublish}
            className={`px-4 py-2 font-medium text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 ${
              draftStatus === 'SAVED_DRAFT'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
          >
            <Send size={15} /> Tạo Ca Thi / Công Bố
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {generatedExams.map((exam) => (
          <div key={exam.code} className="p-4 border border-gray-100 rounded-xl bg-gray-50/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 bg-blue-600 text-white font-medium text-xs rounded-lg">
                {exam.code}
              </span>
              <span className="text-[11px] font-medium text-gray-500">{exam.totalPoints} điểm</span>
            </div>

            <p className="text-xs text-gray-600 font-medium">
              Gồm {exam.questionIds.length} câu trắc nghiệm. Khi sinh viên vào thi, hệ thống sẽ random theo cấu hình ca thi.
            </p>

            <p className="text-[11px] text-gray-500">
              Điểm mỗi câu: {exam.pointsPerQuestion} điểm.
            </p>

            <div className="flex items-center gap-2 pt-2 border-t border-gray-200/60">
              <button
                onClick={() => onPreview(exam)}
                className="flex-1 py-1.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Eye size={13} /> Xem trước
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
