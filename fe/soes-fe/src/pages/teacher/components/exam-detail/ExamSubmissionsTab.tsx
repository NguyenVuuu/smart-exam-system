import { Eye, ShieldAlert, CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import AppBadge from "../../../../components/common/AppBadge";
import AppSelect from "../../../../components/common/AppSelect";
import DataTable, {
  type ColumnDef,
} from "../../../../components/common/DataTable";
import { formatSessionRange } from "../../../../utils/date.utils";
import type {
  ExamSchedule,
  ExamSubmission,
  ResultReleaseMode,
} from "../../types/teacher-exam.types";

export function ExamSubmissionsTab({
  submissions,
  sessions,
  selectedSessionId,
  onSessionChange,
  onViewSubmission,
  onViewViolations,
  onFinalizeOne,
  onFinalizeAll,
  pendingFinalizeCount,
  loading,
  pagination,
  onPageChange,
  canReview = true,
  showSessionSelector = true,
  unavailableTitle = "Ca thi chưa kết thúc",
  unavailableDescription = "Bài nộp và kết quả chỉ được mở sau khi ca thi kết thúc.",
}: {
  submissions: ExamSubmission[];
  sessions: ExamSchedule[];
  selectedSessionId: string;
  onSessionChange: (sessionId: string) => void;
  resultReleaseText: string;
  resultReleaseMode: ResultReleaseMode;
  resultReleaseAt: string;
  isResultsPublished: boolean;
  onResultReleaseModeChange: (mode: ResultReleaseMode) => void;
  onResultReleaseAtChange: (value: string) => void;
  onResultsPublishedChange: (value: boolean) => void;
  onViewSubmission: (submission: ExamSubmission) => void;
  onViewViolations: (submission: ExamSubmission) => void;
  onFinalizeOne: (submission: ExamSubmission, score: number) => Promise<void>;
  onFinalizeAll: (
    items: Array<{ attemptId: string; score: number }>,
  ) => Promise<number>;
  pendingFinalizeCount: number;
  loading: boolean;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  canReview?: boolean;
  showSessionSelector?: boolean;
  unavailableTitle?: string;
  unavailableDescription?: string;
}) {
  const [scores, setScores] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setScores((current) => {
      const next = { ...current };
      for (const submission of submissions) {
        if (next[submission.attemptId] === undefined) {
          next[submission.attemptId] = String(
            submission.finalScore ?? submission.autoScore ?? 0,
          );
        }
      }
      return next;
    });
  }, [submissions]);

  const readyToFinalize = useMemo(
    () => submissions.filter((submission) => submission.status !== "PUBLISHED"),
    [submissions],
  );

  const parsedScore = (submission: ExamSubmission) => {
    const value = Number(
      scores[submission.attemptId] ??
        submission.finalScore ??
        submission.autoScore ??
        0,
    );
    return Number.isFinite(value) ? value : NaN;
  };

  const ensureViolationViewed = (submission: ExamSubmission) => {
    if (submission.violationCount > 0 && !submission.violationsViewed) {
      toast.warning(
        "Vui lòng mở xem vi phạm của sinh viên này trước khi chốt điểm.",
      );
      return false;
    }
    return true;
  };

  const handleFinalizeOne = async (submission: ExamSubmission) => {
    if (!ensureViolationViewed(submission)) return;
    const score = parsedScore(submission);
    if (!Number.isFinite(score)) {
      toast.error("Điểm chốt không hợp lệ.");
      return;
    }
    if (!window.confirm(`Chốt điểm ${score} cho ${submission.studentName}?`))
      return;
    setSaving(true);
    try {
      await onFinalizeOne(submission, score);
      toast.success("Đã chốt điểm.");
    } catch {
      toast.error(
        "Không thể chốt điểm. Kiểm tra lại các bài có vi phạm chưa mở xem.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleFinalizeAll = async () => {
    const blocked = readyToFinalize.filter(
      (submission) =>
        submission.violationCount > 0 && !submission.violationsViewed,
    );
    if (blocked.length > 0) {
      toast.warning(`Còn ${blocked.length} bài có vi phạm chưa được mở xem.`);
      return;
    }
    const items = readyToFinalize.map((submission) => ({
      attemptId: submission.attemptId,
      score: parsedScore(submission),
    }));
    if (items.some((item) => !Number.isFinite(item.score))) {
      toast.error("Có điểm chốt không hợp lệ.");
      return;
    }
    if (
      !window.confirm("Chốt điểm cho toàn bộ bài chưa chốt trong ca thi này?")
    )
      return;
    setSaving(true);
    try {
      const finalizedCount = await onFinalizeAll(items);
      if (finalizedCount === 0) {
        toast.info("Không còn bài cần chốt.");
      } else {
        toast.success(`Đã chốt điểm cho ${finalizedCount} bài trong ca thi.`);
      }
    } catch (error) {
      const blockedCount =
        error instanceof Error && "blockedCount" in error
          ? Number(error.blockedCount)
          : 0;
      if (blockedCount > 0) {
        toast.warning(
          `Còn ${blockedCount} bài trong ca có vi phạm chưa được mở xem.`,
        );
      } else {
        toast.error(
          "Không thể chốt điểm. Kiểm tra lại các bài có vi phạm chưa mở xem.",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnDef<ExamSubmission>[] = [
    {
      header: "MSSV",
      width: "120px",
      render: (s) => (
        <span className="text-sm font-semibold text-blue-600">
          {s.studentCode}
        </span>
      ),
    },
    {
      header: "Sinh viên",
      width: "210px",
      render: (s) => (
        <span className="text-sm font-bold text-gray-900">{s.studentName}</span>
      ),
    },
    {
      header: "Nộp lúc",
      width: "150px",
      render: (s) =>
        s.hasSubmitted ? (
          <span className="text-sm font-medium text-gray-600">
            {s.submittedAt}
          </span>
        ) : (
          <span className="inline-flex rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">
            Không tham gia
          </span>
        ),
    },
    {
      header: "Điểm hệ thống",
      width: "130px",
      align: "center",
      render: (s) => (
        <span className="text-sm font-semibold text-gray-800">
          {s.autoScore === null ? "-" : `${s.autoScore}đ`}
        </span>
      ),
    },
    {
      header: "Vi phạm",
      width: "120px",
      align: "center",
      render: (s) => {
        if (s.violationCount === 0) {
          return (
            <button
              type="button"
              disabled
              className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-400"
            >
              Không có
            </button>
          );
        }
        return (
          <button
            type="button"
            onClick={() => onViewViolations(s)}
            className={`relative inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
              s.violationsViewed
                ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
          >
            <ShieldAlert size={14} />
            {s.violationCount}
            {!s.violationsViewed && (
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-rose-600" />
            )}
          </button>
        );
      },
    },
    {
      header: "Điểm chốt",
      width: "130px",
      align: "center",
      render: (s) => (
        <input
          type="number"
          min={0}
          step={0.01}
          disabled={s.status === "PUBLISHED"}
          value={scores[s.attemptId] ?? ""}
          onChange={(event) =>
            setScores((current) => ({
              ...current,
              [s.attemptId]: event.target.value,
            }))
          }
          className="h-9 w-24 rounded-lg border border-gray-200 bg-white px-2 text-center text-sm font-semibold text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
        />
      ),
    },
    {
      header: "Trạng thái",
      width: "130px",
      align: "center",
      render: (s) =>
        s.status === "PUBLISHED" ? (
          <AppBadge tone="emerald">Đã chốt</AppBadge>
        ) : (
          <AppBadge tone="amber">Chưa chốt</AppBadge>
        ),
    },
    {
      header: "Phúc khảo",
      width: "130px",
      align: "center",
      render: (s) => {
        if (!s.regradeRequest)
          return <span className="text-sm text-gray-400">-</span>;
        const labels = {
          PENDING: "Chờ xử lý",
          IN_REVIEW: "Đang xử lý",
          RESOLVED: "Đã xử lý",
          REJECTED: "Đã từ chối",
        };
        const tones = {
          PENDING: "blue",
          IN_REVIEW: "amber",
          RESOLVED: "emerald",
          REJECTED: "rose",
        } as const;
        return (
          <AppBadge tone={tones[s.regradeRequest.status]}>
            {labels[s.regradeRequest.status]}
          </AppBadge>
        );
      },
    },
    {
      header: "Thao tác",
      width: "120px",
      align: "right",
      render: (submission) => {
        const canViewSubmission = submission.hasSubmitted;
        return (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                if (canViewSubmission) onViewSubmission(submission);
              }}
              disabled={!canViewSubmission}
              title={
                canViewSubmission ? "Xem bài làm" : "Sinh viên không nộp bài"
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
            >
              <Eye size={17} />
            </button>
            <button
              type="button"
              onClick={() => void handleFinalizeOne(submission)}
              disabled={saving || submission.status === "PUBLISHED"}
              title="Chốt điểm"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CheckCircle2 size={17} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      {showSessionSelector && (
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
          <div>
            <p className="text-base font-semibold text-gray-900">
              Ca thi đang xem
            </p>
            <p className="mt-0.5 text-sm text-gray-500">
              Chọn ca thi để rà soát bài nộp và chốt điểm.
            </p>
          </div>
          <AppSelect
            value={selectedSessionId}
            onChange={onSessionChange}
            className="w-full sm:w-96"
            buttonClassName="bg-gray-50 rounded-xl py-2.5 text-sm"
            options={sessions.map((session) => ({
              value: session.id,
              label: `${session.courseCode} - ${formatSessionRange(session.startTime, session.endTime)}`,
            }))}
          />
        </div>
      )}

      {!canReview && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
          <p className="text-base font-semibold text-gray-900">
            {unavailableTitle}
          </p>
          <p className="mt-1 text-sm text-gray-500">{unavailableDescription}</p>
        </div>
      )}

      {canReview && (
        <>
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
            <div>
              <p className="text-base font-semibold text-gray-900">
                Rà soát và chốt điểm
              </p>
              <p className="mt-0.5 text-sm text-gray-500">
                Điểm chốt mặc định lấy từ điểm hệ thống. Bài có vi phạm phải mở
                xem trước khi chốt.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleFinalizeAll()}
              disabled={saving || pendingFinalizeCount === 0}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 size={17} />
              Chốt cả ca
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <DataTable
              columns={columns}
              data={submissions}
              keyExtractor={(s) => s.id}
              emptyText="Chưa có sinh viên nào nộp bài trong ca thi này"
              pageSize={10}
              isLoading={loading}
              page={pagination.page}
              totalItems={pagination.totalItems}
              totalPages={pagination.totalPages}
              onPageChange={onPageChange}
            />
          </div>
        </>
      )}
    </div>
  );
}
