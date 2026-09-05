import React from 'react'
import { ArrowLeft, CheckCircle2, Save } from 'lucide-react'
import type { ExamCategory } from '../../types/teacher-exam.types'

interface ExamEditorHeaderProps {
  onBack: () => void
  onSaveDraft: () => void
  onPublishExam: () => void
  examCategory: ExamCategory
  isDepartmentHead: boolean
}

export const ExamEditorHeader: React.FC<ExamEditorHeaderProps> = ({
  onBack,
  onSaveDraft,
  onPublishExam,
  examCategory,
  isDepartmentHead,
}) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={16} />
        <span>Quay lại danh sách đề thi</span>
      </button>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSaveDraft}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
        >
          <Save size={15} /> Lưu nháp (Draft)
        </button>
        <button
          type="button"
          onClick={onPublishExam}
          className={`px-5 py-2 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 ${
            examCategory === 'FINAL' && !isDepartmentHead
              ? 'bg-amber-600 hover:bg-amber-700'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          <CheckCircle2 size={15} />
          {examCategory === 'FINAL' && !isDepartmentHead
            ? 'Gửi duyệt đề thi'
            : 'Tạo & Công bố đề'}
        </button>
      </div>
    </div>
  )
}
