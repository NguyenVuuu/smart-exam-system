import { CalendarClock, Plus } from 'lucide-react'
import AppCard from '../../../../components/common/AppCard'
import type { ExamSchedule } from '../../types/teacher-exam.types'
import { ExamSessionList } from './session/ExamSessionList'

export default function ExamSessionsTab({
  sessions,
  onCreateSession,
  onViewSession,
  onEditSession,
  onDeleteSession,
}: {
  sessions: ExamSchedule[]
  onCreateSession: () => void
  onViewSession: (session: ExamSchedule) => void
  onEditSession: (session: ExamSchedule) => void
  onDeleteSession: (sessionId: string) => void
}) {
  return (
    <div className="space-y-5">
      <AppCard className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <CalendarClock size={18} />
          </div>
          <div>
            <h2 className="text-xs font-bold text-gray-900">Ca thi / Lớp áp dụng</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Mỗi ca thi có lớp, thời gian, hiển thị điểm, IP và quy định chống gian lận riêng.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCreateSession}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-xl flex items-center justify-center gap-1.5"
        >
          <Plus size={15} /> Tạo ca thi
        </button>
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
