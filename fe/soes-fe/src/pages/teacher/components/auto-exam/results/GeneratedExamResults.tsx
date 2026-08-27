import { Eye, FileCheck, Send } from 'lucide-react'
import type { AutoExamDraftStatus, GeneratedExamDraft } from '../../../types/teacher-auto-exam.types'

export default function GeneratedExamResults({
  generatedExams,
  draftStatus,
  onSaveDraft,
  onPublish,
  onPreview,
}: {
  generatedExams: GeneratedExamDraft[]
  draftStatus: AutoExamDraftStatus
  onSaveDraft: () => void
  onPublish: () => void
  onPreview: (exam: GeneratedExamDraft) => void
}) {
  if (generatedExams.length === 0) return null

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <FileCheck size={20} className="text-blue-600" />
          Kết Quả Sinh Đề Tự Động
        </h2>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onSaveDraft}
            className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <FileCheck size={16} /> Lưu Nháp Đề
          </button>

          <button
            onClick={onPublish}
            className={`px-5 py-2.5 font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center gap-1.5 ${
              draftStatus === 'SAVED_DRAFT'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
          >
            <Send size={16} /> Tạo Ca Thi / Công Bố
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {generatedExams.map((exam) => (
          <div key={exam.id} className="p-5 border border-gray-100 rounded-2xl bg-gray-50/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-blue-600 text-white font-semibold text-xs rounded-lg">
                Đề đã sinh ({exam.id})
              </span>
              <span className="text-sm font-bold text-gray-800">{exam.totalPoints} điểm</span>
            </div>

            <p className="text-sm text-gray-700 font-medium">
              Gồm {exam.questionIds.length} câu trắc nghiệm. Khi sinh viên vào thi, hệ thống sẽ random theo cấu hình ca thi.
            </p>

            <p className="text-xs text-gray-500">
              Điểm được chia chính xác theo tổng mục tiêu; sai số làm tròn được bù vào câu cuối.
            </p>

            <div className="flex items-center gap-2 pt-2 border-t border-gray-200/60">
              <button
                onClick={() => onPreview(exam)}
                className="flex-1 py-2 bg-white hover:bg-gray-100 border border-gray-200 text-gray-800 font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Eye size={15} /> Xem trước đề thi
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
