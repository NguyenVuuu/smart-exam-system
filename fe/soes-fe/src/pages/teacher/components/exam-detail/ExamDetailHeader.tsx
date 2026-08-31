import {
  Copy,
  Edit,
  Eye,
  LockKeyhole,
  Send,
  UnlockKeyhole,
  UserCheck,
  UserX,
} from 'lucide-react'
import AppBadge from '../../../../components/common/AppBadge'
import type { Exam } from '../../types/teacher-exam.types'
import { getExamCapabilities } from '../../utils/ExamCapabilities'
import { examStatusLabel, examStatusTone } from '../../constants/examStatus'

const actionButtonClassName =
  'inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors'
const neutralButtonClassName = `${actionButtonClassName} bg-gray-100 text-gray-700 hover:bg-gray-200`
const primaryButtonClassName = `${actionButtonClassName} bg-blue-600 text-white shadow-xs hover:bg-blue-700`
const amberButtonClassName = `${actionButtonClassName} bg-amber-50 text-amber-700 hover:bg-amber-100`
const blueSoftButtonClassName = `${actionButtonClassName} bg-blue-50 text-blue-700 hover:bg-blue-100`
const emeraldButtonClassName = `${actionButtonClassName} bg-emerald-50 text-emerald-700 hover:bg-emerald-100`
const actionIconSize = 14

export function ExamDetailHeader({
  exam,
  onEdit,
  onPublish,
  onPreview,
  onCopy,
  onToggleStudentVisibility,
  onLockDistribution,
  onUnlockDistribution,
  contentOnly = false,
}: {
  exam: Exam
  onEdit: () => void
  onPublish: () => void
  onPreview: () => void
  onCopy: () => void
  onToggleStudentVisibility: () => void
  onLockDistribution: () => void
  onUnlockDistribution: () => void
  contentOnly?: boolean
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
            {examStatusLabel[exam.status]}
          </AppBadge>
          <AppBadge className="text-xs font-semibold px-2.5 py-1">
            {exam.semesterCode}
          </AppBadge>
          {exam.status !== 'DRAFT' && exam.studentVisibility === 'HIDDEN' && (
            <AppBadge className="text-xs font-semibold px-2.5 py-1">
              <UserX size={13} /> Đã ẩn khỏi SV
            </AppBadge>
          )}
        </div>
        <h1 className="mt-2 text-xl font-bold text-gray-900">{exam.title}</h1>
        <p className="text-sm text-gray-500 mt-1">{exam.description}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onPreview}
          className={neutralButtonClassName}
        >
          <Eye size={actionIconSize} /> Xem đề
        </button>
        <button
          onClick={onCopy}
          className={neutralButtonClassName}
        >
          <Copy size={actionIconSize} /> Sao chép đề
        </button>
        {!contentOnly && capabilities.canToggleStudentVisibility && (
          <button
            onClick={onToggleStudentVisibility}
            className={
              exam.studentVisibility === 'HIDDEN'
                ? emeraldButtonClassName
                : amberButtonClassName
            }
          >
            {exam.studentVisibility === 'HIDDEN' ? (
              <>
                <UserCheck size={actionIconSize} /> Hiện cho SV
              </>
            ) : (
              <>
                <UserX size={actionIconSize} /> Ẩn khỏi SV
              </>
            )}
          </button>
        )}
        {!contentOnly && capabilities.canSchedule && (
          <button
            onClick={onPublish}
            className={primaryButtonClassName}
          >
            <Send size={actionIconSize} /> Tạo ca thi
          </button>
        )}
        {!contentOnly && capabilities.canEdit && (
          <button
            onClick={onEdit}
            className={neutralButtonClassName}
          >
            <Edit size={actionIconSize} /> Sửa cấu hình đề thi
          </button>
        )}
        {!contentOnly && capabilities.canLock && (
          <button
            onClick={onLockDistribution}
            className={amberButtonClassName}
          >
            <LockKeyhole size={actionIconSize} /> Chốt lịch thi
          </button>
        )}
        {!contentOnly && capabilities.canUnlock && (
          <button
            onClick={onUnlockDistribution}
            className={blueSoftButtonClassName}
          >
            <UnlockKeyhole size={actionIconSize} /> Mở lại lịch thi
          </button>
        )}
      </div>
    </div>
  )
}
