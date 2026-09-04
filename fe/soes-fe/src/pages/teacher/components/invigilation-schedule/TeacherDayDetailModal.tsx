import { Calendar, Clock, Eye, GraduationCap, ShieldCheck, X } from 'lucide-react'
import AppBadge from '../../../../components/common/AppBadge'
import type {
  ProctorAssignmentApiDto,
  ProctorAssignmentStatus,
} from '../../types/teacher-course-api.types'
import { formatFullDate, formatTimeRange } from '../../utils/scheduleCalendar.utils'

interface TeacherDayDetailModalProps {
  isOpen: boolean
  date: Date | null
  assignments: ProctorAssignmentApiDto[]
  statusMeta: Record<ProctorAssignmentStatus, { label: string; tone: 'blue' | 'emerald' | 'gray' | 'rose' }>
  onClose: () => void
  onOpenProctoring: (assignment: ProctorAssignmentApiDto) => void
}

export default function TeacherDayDetailModal({
  isOpen,
  date,
  assignments,
  statusMeta,
  onClose,
  onOpenProctoring,
}: TeacherDayDetailModalProps) {
  if (!isOpen || !date) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 sm:p-6 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 shadow-2xs">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 capitalize">
                {formatFullDate(date)}
              </h3>
              <p className="text-xs font-medium text-slate-500">
                {assignments.length > 0
                  ? `Có ${assignments.length} ca coi thi được xếp trong ngày này`
                  : 'Không có ca coi thi nào được xếp trong ngày này'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-gray-100 hover:text-slate-700 transition-colors"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content List */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3.5">
          {assignments.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Calendar size={28} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium">Không có ca coi thi nào trong ngày này.</p>
            </div>
          ) : (
            assignments.map((item) => {
              const meta = statusMeta[item.status]
              const isLive = item.status === 'OPEN'

              return (
                <div
                  key={item.id}
                  className={`rounded-xl border p-4 sm:p-4.5 transition-all shadow-2xs ${
                    isLive
                      ? 'border-emerald-300 bg-emerald-50/30'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <AppBadge tone={meta.tone}>{meta.label}</AppBadge>
                        <span className="rounded-md bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                          {item.source === 'ASSIGNED' ? 'Được phân công' : 'Tự tạo ca thi'}
                        </span>
                      </div>

                      <h4 className="mt-1.5 text-[15px] font-bold text-slate-900 leading-snug">
                        {item.title}
                      </h4>

                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                        <GraduationCap size={15} className="text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-800">{item.courseOffering.subjectName}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-500">Mã lớp:</span>
                        <strong className="text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[11px]">{item.courseOffering.code}</strong>
                      </div>
                    </div>

                    {(isLive || item.status === 'SCHEDULED') && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose()
                          onOpenProctoring(item)
                        }}
                        className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all shadow-2xs ${
                          isLive
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {isLive ? (
                          <>
                            <ShieldCheck size={16} /> Vào giám sát
                          </>
                        ) : (
                          <>
                            <Eye size={16} /> Xem chi tiết
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-600 border-t border-gray-100 pt-2.5">
                    <Clock size={14} className="text-blue-600" />
                    <span>Thời gian thi: <strong className="font-bold text-slate-900">{formatTimeRange(item.startTime, item.endTime)}</strong></span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end border-t border-gray-100 px-6 py-3.5 bg-gray-50/60">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-gray-50 transition-colors shadow-2xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
