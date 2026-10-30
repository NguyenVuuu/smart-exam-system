import { AlertTriangle, CalendarClock, Plus } from 'lucide-react'
import AppCard from '../../../../components/common/AppCard'
import type { ExamSchedule } from '../../types/teacher-exam.types'
import { ExamSessionList } from './session/ExamSessionList'

export default function ExamSessionsTab({
  sessions,
  onCreateSession,
  onViewSession,
  onEditSession,
  onDeleteSession,
  canCreate = true,
  isTampered = false,
  isVerifyRequired = false,
}: {
  sessions: ExamSchedule[]
  onCreateSession: () => void
  onViewSession: (session: ExamSchedule) => void
  onEditSession?: (session: ExamSchedule) => void
  onDeleteSession?: (sessionId: string) => void
  canCreate?: boolean
  isTampered?: boolean
  isVerifyRequired?: boolean
}) {
  const createBlocked = isTampered || isVerifyRequired
  return (
    <div className="space-y-5">
      <AppCard className="p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
            <CalendarClock size={22} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Ca thi / Lớp áp dụng</h2>
            <p className="text-sm text-gray-500 mt-1">
              Mỗi ca thi có lớp, thời gian, hiển thị điểm, IP và quy định chống gian lận riêng.
            </p>
          </div>
        </div>

        {canCreate && (
          <div className="flex flex-col items-end gap-1.5">
            <button
              type="button"
              onClick={createBlocked ? undefined : onCreateSession}
              disabled={createBlocked}
              title={createBlocked ? 'Không thể tạo ca thi: nội dung đề không khớp với bản ghi blockchain' : undefined}
              className={`px-5 py-2.5 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors ${
                createBlocked
                  ? 'bg-gray-300 cursor-not-allowed opacity-60'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Plus size={17} /> Tạo ca thi
            </button>
            {createBlocked && (
              <p className="flex items-center gap-1 text-xs text-red-600 font-medium">
                <AlertTriangle size={12} />
                {isTampered
                  ? 'Đề thi bị khóa do nội dung không khớp blockchain'
                  : 'Cần kiểm tra toàn vẹn đề thi trước khi tạo ca thi'}
              </p>
            )}
          </div>
        )}
      </AppCard>

      <ExamSessionList
        sessions={sessions}
        onView={onViewSession}
        onEdit={onEditSession}
        onRemove={onDeleteSession}
        emptyText="Đề này chưa có ca/lớp áp dụng. Tạo ca thi để mở cho sinh viên."
      />
    </div>
  )
}
