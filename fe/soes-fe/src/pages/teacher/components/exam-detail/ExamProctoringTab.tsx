import { RefreshCw } from "lucide-react";
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
          <AppSelect
            value={selectedSession?.id ?? ""}
            onChange={onSessionChange}
            className="w-full sm:w-80"
            buttonClassName="bg-gray-50 rounded-xl py-2.5 text-sm"
            options={sessions.map((session) => ({
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
