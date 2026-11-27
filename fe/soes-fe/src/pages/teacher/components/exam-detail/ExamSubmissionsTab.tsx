import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getApiErrorMessage } from "../../../../api/errors";
import AppSelect from "../../../../components/common/AppSelect";
import DataTable from "../../../../components/common/DataTable";
import { formatSessionRange } from "../../../../utils/date.utils";
import type {
  ExamSchedule,
  ExamSubmission,
  ResultReleaseMode,
} from "../../types/teacher-exam.types";


import { ReasonModal } from './SubmissionReasonModal'
import { BulkReasonsModal } from './BulkSubmissionReasonsModal'
import { submissionColumns } from './submissionColumns'
import type { AdjustmentType, ChangedItem, BulkModal } from './score-adjustment-options'

export function ExamSubmissionsTab({
  submissions,
  sessions,
  selectedSessionId,
  onSessionChange,
  onViewSubmission,
  onViewViolations,
  violationsByStudentId = {},
  onFinalizeOne,
  onPrepareFinalize,
  onFinalizeAll,
  pendingFinalizeCount,
  makeupSessionStudents,
  makeupSession,
  onOpenMakeupModal,
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
  violationsByStudentId?: Record<string, Array<{ id: string; evidenceImageUrl: string }>>;
  onFinalizeOne: (submission: ExamSubmission, score: number, reason?: string, adjustmentType?: string, evidenceUrls?: string[], violationIds?: string[]) => Promise<void>;
  onPrepareFinalize: (scoreOverrides: Record<string, string>, excludedStudentIds?: string[]) => Promise<Array<{
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
    excludedStudentIds?: string[],
  ) => Promise<number>;
  pendingFinalizeCount: number;
  /** true nếu đang có ca thi dự phòng chưa kết thúc — block chốt điểm */
  hasPendingMakeup?: boolean;
  /** Danh sách SV whitelist của ca dự phòng đang chạy */
  makeupSessionStudents?: Array<{ id: string; studentCode: string; fullName: string }>;
  /** Session object của ca dự phòng (nếu đã tạo) — để hiển thị thông tin */
  makeupSession?: { id: string; status: string; startTime: string; endTime: string } | null;
  /** Mở modal tạo ca dự phòng — chỉ truyền khi ca đã CLOSED và chưa chốt điểm */
  onOpenMakeupModal?: () => void;
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
  const [showMakeupStudents, setShowMakeupStudents] = useState(false);
  // Tổng số bài chưa chốt trong toàn ca (từ API, không phải trang hiện tại)
  const [totalPendingInCa, setTotalPendingInCa] = useState(pendingFinalizeCount);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!makeupSession) return;
    const intervalId = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(intervalId);
  }, [makeupSession]);

  // Sync khi pendingFinalizeCount thay đổi (lần đầu load hoặc sau chốt)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTotalPendingInCa(pendingFinalizeCount);
  }, [pendingFinalizeCount]);

  // Modal lý do — chốt từng bài (điểm thay đổi)
  const [reasonModal, setReasonModal] = useState<{
    submission: ExamSubmission;
    score: number;
  } | null>(null);

  // Modal bulk — chốt cả ca
  const [bulkModal, setBulkModal] = useState<BulkModal | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const makeupTargetIds = useMemo(
    () => new Set((makeupSessionStudents ?? []).map((student) => student.id)),
    [makeupSessionStudents],
  );
  const makeupIsBlocking = Boolean(
    makeupSession &&
    makeupSession.status !== "CANCELLED" &&
    new Date(makeupSession.endTime).getTime() > now,
  );
  const isMakeupTarget = (submission: ExamSubmission) => makeupIsBlocking && makeupTargetIds.has(submission.studentId);

  const handleFinalizeOne = async (submission: ExamSubmission) => {
    if (isMakeupTarget(submission)) {
      toast.info("Sinh viên này được phép thi ca dự phòng; chỉ chốt điểm ở ca dự phòng.");
      return;
    }
    if (!ensureViolationViewed(submission)) return;
    const score = parsedScore(submission);
    if (!Number.isFinite(score)) {
      toast.error("Điểm chốt không hợp lệ.");
      return;
    }
    // Nếu điểm khác autoScore → yêu cầu nhập lý do qua modal
    if (isScoreChanged(submission, score)) {
      setReasonModal({ submission, score });
      return;
    }
    // Điểm giữ nguyên → chốt luôn không cần lý do
    setSaving(true);
    try {
      await onFinalizeOne(submission, score);
      toast.success(`Đã chốt điểm ${score} cho ${submission.studentName}.`);
    } catch (error) {
      const msg = getApiErrorMessage(error, "Không thể chốt điểm.");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmWithReason = async (reason: string, adjustmentType: AdjustmentType, evidenceUrls: string[], violationIds: string[]) => {
    if (!reasonModal) return;
    setSaving(true);
    try {
      await onFinalizeOne(reasonModal.submission, reasonModal.score, reason, adjustmentType, evidenceUrls, violationIds);
      toast.success("Đã chốt điểm.");
      setReasonModal(null);
    } catch (error) {
      const msg = getApiErrorMessage(error, "Không thể chốt điểm.");
      toast.error(msg);
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
            scoreAdjustments: [],
          } as unknown as ExamSubmission,
          score: i.score,
          reason: "",
          adjustmentType: 'OTHER' as AdjustmentType,
          evidenceUrls: [],
          violationIds: [],
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
      const overrides: Array<{ attemptId: string; score: number; reason?: string; adjustmentType?: string; evidenceUrls?: string[]; violationIds?: string[] }> = [];
      // Thêm điểm đã sửa từ UI (tất cả trang)
      for (const [attemptId, raw] of Object.entries(scores)) {
        if (raw !== "" && Number.isFinite(Number(raw))) {
          overrides.push({ attemptId, score: Number(raw) });
        }
      }
      // Gán reason + adjustmentType + evidenceUrls cho những bài trong reasonItems
      const reasonMap = new Map((reasonItems ?? []).map((i) => [i.submission.attemptId, i]));
      const mergedOverrides = overrides.map((item) => {
        const ri = reasonMap.get(item.attemptId)
        return { ...item, reason: ri?.reason, adjustmentType: ri?.adjustmentType, evidenceUrls: ri?.evidenceUrls, violationIds: ri?.violationIds }
      });
      // Thêm những bài có reason nhưng chưa có trong overrides (điểm chưa sửa trực tiếp)
      for (const item of reasonItems ?? []) {
        if (!overrides.some((o) => o.attemptId === item.submission.attemptId)) {
          mergedOverrides.push({ attemptId: item.submission.attemptId, score: item.score, reason: item.reason, adjustmentType: item.adjustmentType, evidenceUrls: item.evidenceUrls, violationIds: item.violationIds });
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

  const columns = submissionColumns({ scores, setScores, saving, onViewSubmission,
    onViewViolations, handleFinalizeOne, isMakeupTarget, isScoreChanged, parsedScore })

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
            <div className="flex shrink-0 items-center gap-2">
              {/* Đã có ca dự phòng → nút xem danh sách SV */}
              {makeupSessionStudents && makeupSessionStudents.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowMakeupStudents(true)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 text-sm font-semibold text-violet-700 hover:bg-violet-100"
                >
                  <RefreshCw size={15} />
                  Ca dự phòng ({makeupSessionStudents.length} SV)
                </button>
              )}
              {/* Chưa có ca dự phòng → nút tạo */}
              {!makeupSessionStudents?.length && onOpenMakeupModal && (
                <button
                  type="button"
                  onClick={onOpenMakeupModal}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                >
                  Tạo ca dự phòng
                </button>
              )}
              <button
                type="button"
                onClick={() => void handleFinalizeAll()}
                disabled={saving || preparing || pendingFinalizeCount === 0 || makeupIsBlocking}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle2 size={17} />
                {preparing ? "Đang tải..." : "Chốt cả ca"}
              </button>
            </div>
          </div>

          {/* Banner cảnh báo ca dự phòng chưa kết thúc */}
          {makeupIsBlocking && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-900">Đang có ca thi dự phòng chưa kết thúc</p>
                  <p className="mt-0.5 text-xs text-amber-700">
                    Vui lòng đợi ca thi dự phòng kết thúc trước khi chốt điểm để đảm bảo điểm của tất cả sinh viên được tính chính xác.
                  </p>
                </div>
              </div>
              {makeupSessionStudents && makeupSessionStudents.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-white px-4 py-3">
                  <p className="text-xs font-semibold text-amber-800 mb-2">
                    Sinh viên được phép thi ca dự phòng ({makeupSessionStudents.length} người):
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                    {makeupSessionStudents.map((s) => (
                      <div key={s.id} className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5">
                        <span className="text-xs font-semibold text-amber-900 w-20 shrink-0">{s.studentCode}</span>
                        <span className="text-xs text-amber-700 truncate">{s.fullName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

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
        <ReasonModal
          submission={reasonModal.submission}
          score={reasonModal.score}
          saving={saving}
          violationEvidences={violationsByStudentId[reasonModal.submission.studentId] ?? []}
          onConfirm={(r, t, e, v) => void handleConfirmWithReason(r, t, e, v)}
          onClose={() => setReasonModal(null)}
        />
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
          violationsByStudentId={violationsByStudentId}
          onConfirm={(items) => void executeFinalizeAll(items)}
          onClose={() => setBulkModal(null)}
        />
      )}

      {/* ── Popup danh sách sinh viên ca dự phòng ── */}
      {showMakeupStudents && makeupSessionStudents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                  <RefreshCw size={17} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Sinh viên ca dự phòng</h3>
                  <p className="text-xs text-gray-500">
                    {makeupSession && (
                      <>
                        {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(makeupSession.startTime))}
                        {' → '}
                        {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(makeupSession.endTime))}
                        {' · '}
                      </>
                    )}
                    {makeupSessionStudents.length} người được phép thi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMakeupStudents(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
              {makeupSessionStudents.map((s, idx) => (
                <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[11px] font-bold text-violet-700">
                    {idx + 1}
                  </span>
                  <span className="w-24 shrink-0 text-xs font-semibold text-gray-800">{s.studentCode}</span>
                  <span className="truncate text-xs text-gray-600">{s.fullName}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 flex justify-end">
              <button
                type="button"
                onClick={() => setShowMakeupStudents(false)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
