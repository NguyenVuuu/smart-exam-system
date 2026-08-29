import {
  ArrowLeft,
  Copy,
  Edit,
  Eye,
  Lock,
  Send,
  UserCheck,
  UserX,
} from 'lucide-react'
import AppBadge from '../../../../components/common/AppBadge'
import type { Exam } from '../../types/teacher-exam.types'
import { getExamCapabilities } from '../../utils/ExamCapabilities'

const examStatusTone = {
  DRAFT: 'amber',
  PENDING_APPROVAL: 'blue',
  REJECTED: 'rose',
  PUBLISHED: 'emerald',
  LOCKED: 'gray',
  ARCHIVED: 'gray',
} as const

export function ExamDetailBackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      onClick={onBack}
      className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
    >
      <ArrowLeft size={18} />
      <span>Quay lại quản lý đề thi</span>
    </button>
  )
}

export function ExamDetailHeader({
  exam,
  onEdit,
  onPublish,
  onPreview,
  onCopy,
  onToggleStudentVisibility,
}: {
  exam: Exam
  onEdit: () => void
  onPublish: () => void
  onPreview: () => void
  onCopy: () => void
  onToggleStudentVisibility: () => void
}) {
  const capabilities = getExamCapabilities(exam)
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <div className="flex items-center gap-2">
          <AppBadge tone="blue" shape="rounded" className="text-xs font-semibold px-2.5 py-1">
            Môn học: {exam.subjectName}
          </AppBadge>
          <AppBadge tone={examStatusTone[exam.status]} className="text-xs font-semibold px-2.5 py-1">
            {exam.status}
          </AppBadge>
          {exam.status !== 'DRAFT' && exam.studentVisibility === 'HIDDEN' && (
            <AppBadge className="text-xs font-semibold px-2.5 py-1">
              <UserX size={13} /> Đã ẩn khỏi SV
            </AppBadge>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-2">{exam.title}</h1>
        <p className="text-sm text-gray-500 mt-1">{exam.description}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onPreview}
          className="px-4.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition-colors flex items-center gap-1.5"
        >
          <Eye size={16} /> Xem đề
        </button>
        <button
          onClick={onCopy}
          className="px-4.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition-colors flex items-center gap-1.5"
        >
          <Copy size={16} /> Sao chép đề
        </button>
        {capabilities.canToggleStudentVisibility && (
          <button
            onClick={onToggleStudentVisibility}
            className={`px-4.5 py-2.5 font-semibold text-sm rounded-xl transition-colors flex items-center gap-1.5 ${
              exam.studentVisibility === 'HIDDEN'
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-700'
            }`}
          >
            {exam.studentVisibility === 'HIDDEN' ? (
              <>
                <UserCheck size={16} /> Hiện cho SV
              </>
            ) : (
              <>
                <UserX size={16} /> Ẩn khỏi SV
              </>
            )}
          </button>
        )}
        {capabilities.canSchedule && (
          <button
            onClick={onPublish}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Send size={16} /> Tạo ca thi
          </button>
        )}
        {capabilities.canEdit ? (
          <button
            onClick={onEdit}
            className="px-4.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Edit size={16} /> Sửa cấu hình đề thi
          </button>
        ) : (
          <span
            className="px-4 py-2.5 bg-gray-50 border border-gray-200/80 text-gray-500 font-semibold text-sm rounded-xl inline-flex items-center gap-1.5 shadow-2xs"
            title={capabilities.lockReason || 'Đề thi đã khóa chỉnh sửa'}
          >
            <Lock size={15} className="text-gray-400" />
            {exam.status === 'PENDING_APPROVAL' ? 'ĐANG CHỜ DUYỆT' : 'ĐÃ KHÓA'}
          </span>
        )}
      </div>
    </div>
  )
}
