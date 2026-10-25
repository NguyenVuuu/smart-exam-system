import { Eye, ShieldAlert, CheckCircle2, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
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

// ── Types nội bộ ──────────────────────────────────────────────────────────────

/** Một dòng sinh viên có điểm thay đổi trong luồng "chốt cả ca" */
interface ChangedItem {
  submission: ExamSubmission;
  score: number;
  reason: string;
}

/** Trạng thái modal bulk */
type BulkModal =
  | { kind: "confirm" }
  | { kind: "reasons"; items: ChangedItem[]; cursor: number };

// ── BulkReasonsModal — component riêng để tránh stale closure ─────────────────

function BulkReasonsModal({
  initialItems,
  totalPending,
  saving,
  onConfirm,
  onClose,
}: {
  initialItems: ChangedItem[];
  totalPending: number;
  saving: boolean;
  onConfirm: (items: ChangedItem[]) => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState<ChangedItem[]>(initialItems);
  const [cursor, setCursor] = useState(0);

  const current = items[cursor]!;
  const allFilled = items.every((i) => i.reason.trim().length >= 5);

  const updateReason = (value: string) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === cursor ? { ...item, reason: value } : item))
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-1 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Điền lý do điều chỉnh điểm</h3>
              <p className="text-xs text-gray-400">
                {items.length} sinh viên có điểm chốt khác điểm hệ thống
              </p>
            </div>
          </div>
          {/* Phân trang */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setCursor((c) => c - 1)}
              disabled={cursor === 0}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="min-w-[3rem] text-center text-xs font-semibold text-gray-600">
              {cursor + 1} / {items.length}
            </span>
            <button
              type="button"
              onClick={() => setCursor((c) => c + 1)}
              disabled={cursor === items.length - 1}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Thông tin sinh viên */}
        <div className="my-3 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
          <p className="text-sm font-bold text-gray-900">{current.submission.studentName}</p>
          <p className="text-xs text-gray-500 mt-0.5">{current.submission.studentCode}</p>
          <div className="mt-2 flex items-center gap-3 text-xs font-semibold">
            <span className="text-gray-500">
              Điểm hệ thống:{" "}
              <span className="text-gray-800">{current.submission.autoScore ?? 0}đ</span>
            </span>
            <span className="text-gray-300">→</span>
            <span className="text-amber-700">Điểm chốt: {current.score}đ</span>
          </div>
        </div>

        {/* Ô lý do */}
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Lý do điều chỉnh <span className="text-rose-500">*</span>
          </label>
          <textarea
            key={cursor}
            value={current.reason}
            onChange={(e) => updateReason(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Nhập lý do (ít nhất 5 ký tự)..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 outline-none focus:border-amber-400 focus:bg-white"
            autoFocus
          />
          <div className="mt-1 flex items-center justify-between">
            <span className={`text-xs ${current.reason.trim().length >= 5 ? "text-emerald-600" : "text-gray-400"}`}>
              {current.reason.trim().length >= 5 ? "✓ Đã điền" : "Cần ít nhất 5 ký tự"}
            </span>
            <span className="text-xs text-gray-400">{current.reason.length}/500</span>
          </div>
        </div>

        {/* Tiến độ */}
        <div className="mb-4 flex gap-1">
          {items.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCursor(idx)}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                item.reason.trim().length >= 5
                  ? "bg-emerald-400"
                  : idx === cursor
                    ? "bg-amber-400"
                    : "bg-gray-200"
              }`}
              title={item.submission.studentName}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => onConfirm(items)}
            disabled={saving || !allFilled}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            title={!allFilled ? "Vui lòng điền lý do cho tất cả sinh viên" : undefined}
          >
            {saving ? "Đang chốt..." : `Chốt cả ca (${totalPending} bài)`}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ExamSubmissionsTab({
  submissions,
  sessions,
  selectedSessionId,
  onSessionChange,
  onViewSubmission,
  onViewViolations,
  onFinalizeOne,
  onPrepareFinalize,
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
  onFinalizeOne: (submission: ExamSubmission, score: number, reason?: string) => Promise<void>;
  onPrepareFinalize: (scoreOverrides: Record<string, string>) => Promise<Array<{
    attemptId: string;
    studentCode: string;
    studentName: string;
    autoScore: number;
    score: number;
    isChanged: boolean;
    violationBlocked: boolean;
  }>>;
  onFinalizeAll: (
    items: Array<{ attemptId: string; score: number; reason?: string }>,
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
  const [preparing, setPreparing] = useState(false);
  // Tổng số bài chưa chốt trong toàn ca (từ API, không phải trang hiện tại)
  const [totalPendingInCa, setTotalPendingInCa] = useState(pendingFinalizeCount);

  // Sync khi pendingFinalizeCount thay đổi (lần đầu load hoặc sau chốt)
  useEffect(() => {
    setTotalPendingInCa(pendingFinalizeCount);
  }, [pendingFinalizeCount]);

  // Modal lý do — chốt từng bài (điểm thay đổi)
  const [reasonModal, setReasonModal] = useState<{
    submission: ExamSubmission;
    score: number;
  } | null>(null);
  const [reason, setReason] = useState("");

  // Modal bulk — chốt cả ca
  const [bulkModal, setBulkModal] = useState<BulkModal | null>(null);

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

  const isScoreChanged = (submission: ExamSubmission, score: number) => {
    const auto = submission.autoScore ?? 0;
    return Math.abs(score - auto) > 0.001;
  };

  const handleFinalizeOne = async (submission: ExamSubmission) => {
    if (!ensureViolationViewed(submission)) return;
    const score = parsedScore(submission);
    if (!Number.isFinite(score)) {
      toast.error("Điểm chốt không hợp lệ.");
      return;
    }
    // Nếu điểm khác autoScore → yêu cầu nhập lý do qua modal
    if (isScoreChanged(submission, score)) {
      setReason("");
      setReasonModal({ submission, score });
      return;
    }
    // Điểm giữ nguyên → chốt luôn không cần lý do
    setSaving(true);
    try {
      await onFinalizeOne(submission, score);
      toast.success(`Đã chốt điểm ${score} cho ${submission.studentName}.`);
    } catch {
      toast.error("Không thể chốt điểm. Kiểm tra lại các bài có vi phạm chưa mở xem.");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmWithReason = async () => {
    if (!reasonModal) return;
    if (reason.trim().length < 5) {
      toast.error("Lý do phải có ít nhất 5 ký tự.");
      return;
    }
    setSaving(true);
    try {
      await onFinalizeOne(reasonModal.submission, reasonModal.score, reason.trim());
      toast.success("Đã chốt điểm.");
      setReasonModal(null);
    } catch {
      toast.error("Không thể chốt điểm.");
    } finally {
      setSaving(false);
    }
  };

  const handleFinalizeAll = async () => {
    setPreparing(true);
    try {
      // Lấy toàn bộ ca (không phân trang), áp dụng điểm user đã sửa trên UI
      const allItems = await onPrepareFinalize(scores);

      const blocked = allItems.filter((i) => i.violationBlocked);
      if (blocked.length > 0) {
        toast.warning(`Còn ${blocked.length} bài có vi phạm chưa được mở xem.`);
        return;
      }
      const hasInvalid = allItems.some((i) => !Number.isFinite(i.score));
      if (hasInvalid) {
        toast.error("Có điểm chốt không hợp lệ.");
        return;
      }

      const changedItems: ChangedItem[] = allItems
        .filter((i) => i.isChanged)
        .map((i) => ({
          submission: {
            attemptId: i.attemptId,
            studentCode: i.studentCode,
            studentName: i.studentName,
            autoScore: i.autoScore,
          } as unknown as ExamSubmission,
          score: i.score,
          reason: "",
        }));

      // Lưu tổng bài chưa chốt trong toàn ca để hiển thị đúng trong modal
      setTotalPendingInCa(allItems.length);

      if (changedItems.length > 0) {
        setBulkModal({ kind: "reasons", items: changedItems, cursor: 0 });
      } else {
        setBulkModal({ kind: "confirm" });
      }
    } catch {
      toast.error("Không thể tải danh sách bài thi. Vui lòng thử lại.");
    } finally {
      setPreparing(false);
    }
  };

  const executeFinalizeAll = async (reasonItems?: ChangedItem[]) => {
    setSaving(true);
    try {
      // Build override map: chỉ truyền những bài user đã sửa điểm (từ scores state)
      // + lý do cho những bài thay đổi. Hook sẽ tự dùng autoScore cho phần còn lại.
      const overrides: Array<{ attemptId: string; score: number; reason?: string }> = [];
      // Thêm điểm đã sửa từ UI (tất cả trang)
      for (const [attemptId, raw] of Object.entries(scores)) {
        if (raw !== "" && Number.isFinite(Number(raw))) {
          overrides.push({ attemptId, score: Number(raw) });
        }
      }
      // Gán reason cho những bài trong reasonItems
      const reasonMap = new Map((reasonItems ?? []).map((i) => [i.submission.attemptId, i.reason]));
      const mergedOverrides = overrides.map((item) => ({
        ...item,
        reason: reasonMap.get(item.attemptId),
      }));
      // Thêm những bài có reason nhưng chưa có trong overrides (điểm chưa sửa trực tiếp)
      for (const item of reasonItems ?? []) {
        if (!overrides.some((o) => o.attemptId === item.submission.attemptId)) {
          mergedOverrides.push({ attemptId: item.submission.attemptId, score: item.score, reason: item.reason });
        }
      }

      const finalizedCount = await onFinalizeAll(mergedOverrides);
      setBulkModal(null);
      if (finalizedCount === 0) {
        toast.info("Không còn bài cần chốt.");
      } else {
        toast.success(`Đã chốt điểm cho ${finalizedCount} bài trong ca thi.`);
      }
    } catch (error) {
      const blockedCount =
        error instanceof Error && "blockedCount" in error
          ? Number((error as { blockedCount: number }).blockedCount)
          : 0;
      if (blockedCount > 0) {
        toast.warning(`Còn ${blockedCount} bài có vi phạm chưa được mở xem.`);
      } else {
        toast.error("Không thể chốt điểm. Vui lòng thử lại.");
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
              title={
                isScoreChanged(submission, parsedScore(submission))
                  ? "Chốt điểm (đã chỉnh sửa — cần lý do)"
                  : "Chốt điểm"
              }
              className={`inline-flex h-9 w-9 items-center justify-center rounded-lg disabled:cursor-not-allowed disabled:opacity-40 ${
                isScoreChanged(submission, parsedScore(submission))
                  ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              {isScoreChanged(submission, parsedScore(submission)) ? (
                <MessageSquare size={17} />
              ) : (
                <CheckCircle2 size={17} />
              )}
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
              disabled={saving || preparing || pendingFinalizeCount === 0}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 size={17} />
              {preparing ? "Đang tải..." : "Chốt cả ca"}
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

      {/* ── Modal lý do — chốt từng bài (điểm thay đổi) ── */}
      {reasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <MessageSquare size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Điểm chốt khác điểm hệ thống
                </h3>
                <p className="mt-0.5 text-sm text-gray-500">
                  Sinh viên{" "}
                  <span className="font-semibold text-gray-800">
                    {reasonModal.submission.studentName}
                  </span>{" "}
                  — Điểm hệ thống:{" "}
                  <span className="font-semibold text-gray-800">
                    {reasonModal.submission.autoScore ?? 0}đ
                  </span>{" "}
                  → Điểm chốt:{" "}
                  <span className="font-semibold text-amber-700">
                    {reasonModal.score}đ
                  </span>
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="finalize-reason"
                className="mb-1.5 block text-sm font-semibold text-gray-700"
              >
                Lý do điều chỉnh{" "}
                <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="finalize-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Nhập lý do điều chỉnh điểm (ít nhất 5 ký tự)..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 outline-none focus:border-amber-400 focus:bg-white"
                autoFocus
              />
              <p className="mt-1 text-right text-xs text-gray-400">
                {reason.length}/500
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReasonModal(null)}
                disabled={saving}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmWithReason()}
                disabled={saving || reason.trim().length < 5}
                className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Đang chốt..." : "Xác nhận chốt điểm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal bulk — chốt cả ca (xác nhận đơn giản) ── */}
      {bulkModal?.kind === "confirm" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Xác nhận chốt cả ca</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Chốt điểm cho{" "}
                  <span className="font-semibold text-gray-800">{totalPendingInCa} bài</span>{" "}
                  chưa chốt trong ca thi này. Tất cả điểm giữ nguyên theo hệ thống.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setBulkModal(null)}
                disabled={saving}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void executeFinalizeAll()}
                disabled={saving}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? "Đang chốt..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal bulk — chốt cả ca (có điểm thay đổi, nhập lý do từng người) ── */}
      {bulkModal?.kind === "reasons" && (
        <BulkReasonsModal
          initialItems={bulkModal.items}
          totalPending={totalPendingInCa}
          saving={saving}
          onConfirm={(items) => void executeFinalizeAll(items)}
          onClose={() => setBulkModal(null)}
        />
      )}
    </div>
  );
}
