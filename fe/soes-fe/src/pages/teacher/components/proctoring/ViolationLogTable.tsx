import { Image, RefreshCw } from "lucide-react";
import AppBadge from "../../../../components/common/AppBadge";
import TeacherPagination from "../TeacherPagination";
import type { ViolationRecord } from "../../types/teacher-exam.types";
import { formatViolationDateTime } from "../../../../utils/date.utils";
import { violationTypeLabels } from "./violationLog.constants";

const severityTone: Record<
  ViolationRecord["severity"],
  "blue" | "amber" | "rose"
> = {
  LOW: "blue",
  MEDIUM: "amber",
  HIGH: "rose",
};

const reviewTone: Record<
  NonNullable<ViolationRecord["reviewStatus"]>,
  "gray" | "blue" | "amber" | "rose" | "emerald"
> = {
  PENDING: "gray",
  REVIEWED: "blue",
  CONFIRMED: "rose",
  DISMISSED: "emerald",
  WARNED: "amber",
  FORCE_SUBMITTED: "rose",
  INVALIDATED: "rose",
};

function formatViolationDuration(violation: ViolationRecord): string {
  if (violation.durationSeconds === null && violation.endedAt === null)
    return "Đang diễn ra";
  const seconds = violation.durationSeconds;
  if (seconds === undefined || seconds === null) return "-";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest > 0 ? `${minutes}m ${rest}s` : `${minutes}m`;
}

function renderEvidenceCell(
  violation: ViolationRecord,
  onViewEvidence: (url: string) => void,
) {
  if (violation.evidenceImageUrl) {
    return (
      <button
        type="button"
        onClick={() => onViewEvidence(violation.evidenceImageUrl!)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
      >
        <Image size={14} /> Xem ảnh
      </button>
    );
  }

  if (violation.evidenceText) {
    return (
      <span className="inline-block max-w-48 text-xs leading-5 text-slate-500">
        {violation.evidenceText}
      </span>
    );
  }

  return <span className="text-xs text-slate-400">Không có ảnh</span>;
}

export interface ViolationLogTableProps {
  violations: ViolationRecord[];
  onViewEvidence: (url: string) => void;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  emptyText?: string;
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
  onReviewViolation?: (
    violationId: string,
    status: NonNullable<ViolationRecord["reviewStatus"]>,
  ) => void;
}

export default function ViolationLogTable({
  violations,
  onViewEvidence,
  loading = false,
  error = null,
  onRefresh,
  emptyText = "Chưa ghi nhận vi phạm nào trong ca thi này.",
  pagination,
  onPageChange,
  onReviewViolation,
}: ViolationLogTableProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center text-sm text-slate-500">
        <span className="text-rose-600 font-medium">{error}</span>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={14} /> Thử lại
          </button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-48 items-center justify-center px-6 py-12 text-sm text-slate-400">
        <RefreshCw size={18} className="mr-2 animate-spin text-blue-600" />
        Đang tải nhật ký vi phạm...
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="border-y border-gray-100 bg-gray-50 text-[11px] font-semibold uppercase text-slate-500">
          <tr>
            <th className="whitespace-nowrap px-5 py-3">Thời gian</th>
            <th className="whitespace-nowrap px-5 py-3">Sinh viên</th>
            <th className="whitespace-nowrap px-5 py-3">Loại vi phạm</th>
            <th className="whitespace-nowrap px-5 py-3">Mức độ</th>
            <th className="whitespace-nowrap px-5 py-3">Xử lý</th>
            <th className="whitespace-nowrap px-5 py-3">Thời lượng</th>
            <th className="whitespace-nowrap px-5 py-3 text-right">
              Bằng chứng
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {violations.map((violation) => (
            <tr
              key={violation.id}
              className="hover:bg-gray-50/70 transition-colors"
            >
              <td className="whitespace-nowrap px-5 py-4 text-slate-600 font-medium">
                {formatViolationDateTime(violation.timestamp)}
              </td>
              <td className="px-5 py-4">
                <p className="font-semibold text-slate-900">
                  {violation.studentName}
                </p>
                <p className="text-xs text-blue-600 font-medium">
                  MSSV: {violation.studentCode}
                </p>
              </td>
              <td className="px-5 py-4">
                <AppBadge
                  tone={violation.type === "TAB_SWITCH" ? "amber" : "rose"}
                >
                  {violationTypeLabels[violation.type] ?? violation.type}
                </AppBadge>
                {violation.type === "PHONE_DETECTED" && (
                  <p className="mt-1 max-w-60 text-xs text-slate-500">
                    Cần giảng viên xem xét
                    {typeof violation.metadata?.confidence === "number" &&
                      ` · Độ tin cậy ${(violation.metadata.confidence * 100).toFixed(0)}%`}
                  </p>
                )}
              </td>
              <td className="px-5 py-4">
                <AppBadge tone={severityTone[violation.severity] ?? "gray"}>
                  {violation.severity}
                </AppBadge>
              </td>
              <td className="px-5 py-4">
                <div className="space-y-2">
                  <AppBadge
                    tone={
                      reviewTone[violation.reviewStatus ?? "PENDING"] ?? "gray"
                    }
                  >
                    {reviewStatusLabel(violation.reviewStatus ?? "PENDING")}
                  </AppBadge>
                  {onReviewViolation && (
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          onReviewViolation(violation.id, "REVIEWED")
                        }
                        className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
                      >
                        Đã xem
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onReviewViolation(violation.id, "DISMISSED")
                        }
                        className="rounded-md border border-emerald-200 px-2 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-50"
                      >
                        Bỏ qua
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onReviewViolation(violation.id, "WARNED")
                        }
                        className="rounded-md border border-amber-200 px-2 py-1 text-[10px] font-bold text-amber-700 hover:bg-amber-50"
                      >
                        Cảnh cáo
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onReviewViolation(violation.id, "CONFIRMED")
                        }
                        className="rounded-md border border-rose-200 px-2 py-1 text-[10px] font-bold text-rose-700 hover:bg-rose-50"
                      >
                        Xác nhận
                      </button>
                    </div>
                  )}
                </div>
              </td>
              <td className="whitespace-nowrap px-5 py-4 text-slate-600 font-medium">
                {formatViolationDuration(violation)}
              </td>
              <td className="px-5 py-4 text-right">
                {renderEvidenceCell(violation, onViewEvidence)}
                {/* eslint-disable-next-line no-constant-binary-expression */}
                {false &&
                  (violation.evidenceImageUrl ? (
                    <button
                      type="button"
                      onClick={() =>
                        onViewEvidence(violation.evidenceImageUrl!)
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                      <Image size={14} /> Xem ảnh
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">Không có ảnh</span>
                  ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {violations.length === 0 && (
        <div className="px-6 py-12 text-center text-sm text-slate-400">
          {emptyText}
        </div>
      )}

      {pagination && onPageChange && pagination.totalItems > 0 && (
        <TeacherPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          onChange={onPageChange}
        />
      )}
    </div>
  );
}

function reviewStatusLabel(
  status: NonNullable<ViolationRecord["reviewStatus"]>,
) {
  switch (status) {
    case "PENDING":
      return "Chưa xem";
    case "REVIEWED":
      return "Đã xem";
    case "CONFIRMED":
      return "Xác nhận";
    case "DISMISSED":
      return "Bỏ qua";
    case "WARNED":
      return "Đã cảnh cáo";
    case "FORCE_SUBMITTED":
      return "Buộc nộp";
    case "INVALIDATED":
      return "Hủy bài";
    default:
      return status;
  }
}
