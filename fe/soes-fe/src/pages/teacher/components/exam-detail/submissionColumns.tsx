import { CheckCircle2, Eye, MessageSquare, RefreshCw, ShieldAlert } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import AppBadge from '../../../../components/common/AppBadge'
import type { ColumnDef } from '../../../../components/common/DataTable'
import type { ExamSubmission } from '../../types/teacher-exam.types'

interface SubmissionColumnsOptions {
  scores: Record<string, string>
  setScores: Dispatch<SetStateAction<Record<string, string>>>
  saving: boolean
  onViewSubmission: (submission: ExamSubmission) => void
  onViewViolations: (submission: ExamSubmission) => void
  handleFinalizeOne: (submission: ExamSubmission) => Promise<void>
  isMakeupTarget: (submission: ExamSubmission) => boolean
  isScoreChanged: (submission: ExamSubmission, score: number) => boolean
  parsedScore: (submission: ExamSubmission) => number
}

export function submissionColumns({ scores, setScores, saving, onViewSubmission,
  onViewViolations, handleFinalizeOne, isMakeupTarget, isScoreChanged, parsedScore,
}: SubmissionColumnsOptions): ColumnDef<ExamSubmission>[] {
  return [
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
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-bold text-gray-900">{s.studentName}</span>
          {s.isMakeup && (
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
              <RefreshCw size={9} />
              Dự phòng
            </span>
          )}
        </div>
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
          disabled={s.status === "PUBLISHED" || isMakeupTarget(s)}
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
        s.status === "INVALIDATED" ? (
          <AppBadge tone="rose">Đã hủy</AppBadge>
        ) : s.endedBy === "PROCTOR" ? (
          <AppBadge tone="amber">Buộc nộp</AppBadge>
        ) : s.status === "PUBLISHED" ? (
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
              disabled={saving || submission.status === "PUBLISHED" || isMakeupTarget(submission)}
              title={
                isMakeupTarget(submission)
                  ? "Sinh viên sẽ thi ở ca dự phòng"
                  : isScoreChanged(submission, parsedScore(submission))
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
}
