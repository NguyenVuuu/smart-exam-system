import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import AppSelect from "../../../../components/common/AppSelect";
import type {
  ExamSchedule,
  ViolationRecord,
} from "../../types/teacher-exam.types";
import type { TeacherPaginationMeta } from "../../api/teacher-exams.api";
import { formatSessionRange } from "../../../../utils/date.utils";
import ViolationLogTable from "../proctoring/ViolationLogTable";

export function ExamProctoringTab({
  violations,
  sessions,
  selectedSessionId,
  onSessionChange,
  onViewEvidence,
  pagination,
  loading,
  error,
  onPageChange,
  onRefresh,
}: {
  violations: ViolationRecord[];
  sessions: ExamSchedule[];
  selectedSessionId: string;
  onSessionChange: (sessionId: string) => void;
  onViewEvidence: (url: string) => void;
  pagination: TeacherPaginationMeta;
  loading: boolean;
  error: string | null;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}) {
  const selectedSession =
    sessions.find((session) => session.id === selectedSessionId) ?? sessions[0];

  // Phân chia sessions thành ca gốc và ca dự phòng
  const { sourceSessions, makeupSessions } = useMemo(() => {
    const src = sessions.filter((s) => !s.makeupOfScheduleId)
    const mu = sessions.filter((s) => Boolean(s.makeupOfScheduleId))
    return { sourceSessions: src, makeupSessions: mu }
  }, [sessions])

  const hasMakeup = makeupSessions.length > 0
  // Tab: 'source' | 'makeup' — chỉ hiện nếu có ca dự phòng
  const [activeSessionTab, setActiveSessionTab] = useState<'source' | 'makeup'>('source')

  const visibleSessions = hasMakeup
    ? (activeSessionTab === 'source' ? sourceSessions : makeupSessions)
    : sessions

  return (
    <div className="space-y-5">
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Nhật ký giám sát chống gian lận
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {selectedSession
              ? `${selectedSession.courseCode} • ${formatSessionRange(selectedSession.startTime, selectedSession.endTime)}`
              : "Chưa có ca thi để giám sát"}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {/* Tab ca gốc / ca dự phòng — chỉ hiện khi có ca dự phòng */}
          {hasMakeup && (
            <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
              <button
                type="button"
                onClick={() => {
                  setActiveSessionTab('source')
                  if (sourceSessions.length > 0) onSessionChange(sourceSessions[0]!.id)
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeSessionTab === 'source'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Ca gốc ({sourceSessions.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveSessionTab('makeup')
                  if (makeupSessions.length > 0) onSessionChange(makeupSessions[0]!.id)
                }}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeSessionTab === 'makeup'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <RefreshCw size={11} />
                Ca dự phòng ({makeupSessions.length})
              </button>
            </div>
          )}

          <AppSelect
            value={selectedSession?.id ?? ""}
            onChange={onSessionChange}
            className="w-full sm:w-80"
            buttonClassName="bg-gray-50 rounded-xl py-2.5 text-sm"
            options={visibleSessions.map((session) => ({
              value: session.id,
              label: `${session.courseCode} • ${formatSessionRange(session.startTime, session.endTime)}`,
            }))}
          />
          <button
            type="button"
            onClick={onRefresh}
            disabled={!selectedSession || loading}
            className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold text-sm rounded-xl shadow-xs hover:bg-gray-50 flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Làm mới
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <ViolationLogTable
          violations={violations}
          onViewEvidence={onViewEvidence}
          loading={loading}
          error={error}
          onRefresh={onRefresh}
          emptyText="Chưa ghi nhận vi phạm nào trong ca thi này."
          pagination={pagination}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
}
