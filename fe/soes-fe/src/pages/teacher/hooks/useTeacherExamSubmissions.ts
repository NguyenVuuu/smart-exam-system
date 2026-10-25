import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  finalizeTeacherSubmissionScore,
  finalizeTeacherSubmissionScores,
  getAllTeacherExamSubmissions,
  getTeacherExamSubmissions,
  markTeacherSubmissionViolationsViewed,
  updateTeacherResultRelease,
} from "../api/teacher-exams.api";
import { toExamSubmission } from "../mappers/teacher-exam.mapper";
import type {
  ExamSubmission,
  ResultReleaseMode,
} from "../types/teacher-exam.types";

const EMPTY_PAGINATION = {
  page: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 1,
};

function formatSubmissionDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value))
    : "Không nộp";
}

export function useTeacherExamSubmissions(examId: string, scheduleId: string) {
  const [items, setItems] = useState<ExamSubmission[]>([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [pageSelection, setPageSelection] = useState({ scheduleId, page: 1 });
  const [loadedRequestKey, setLoadedRequestKey] = useState("");
  const [resultRelease, setResultRelease] = useState<{
    mode: ResultReleaseMode;
    releaseAt: string;
    published: boolean;
  }>({ mode: "MANUAL", releaseAt: "", published: false });
  const [pendingFinalizeCount, setPendingFinalizeCount] = useState(0);
  const page = pageSelection.scheduleId === scheduleId ? pageSelection.page : 1;
  const requestKey = `${examId}:${scheduleId}:${page}`;

  const applyResponse = useCallback(
    (response: Awaited<ReturnType<typeof getTeacherExamSubmissions>>) => {
      setItems(
        response.items.map((submission) => ({
          ...toExamSubmission(submission),
          submittedAt: formatSubmissionDate(submission.submittedAt),
        })),
      );
      setPagination(response.pagination);
      setResultRelease({
        mode: response.resultRelease.mode,
        releaseAt: response.resultRelease.releaseAt ?? "",
        published: response.resultRelease.published,
      });
    },
    [],
  );

  const refreshPendingFinalizeCount = useCallback(async () => {
    if (!scheduleId) {
      setPendingFinalizeCount(0);
      return;
    }
    const allSubmissions = (
      await getAllTeacherExamSubmissions(examId, scheduleId)
    ).map(toExamSubmission);
    setPendingFinalizeCount(
      allSubmissions.filter((submission) => submission.status !== "PUBLISHED")
        .length,
    );
  }, [examId, scheduleId]);

  const reload = useCallback(async () => {
    if (!scheduleId) return;
    setLoadedRequestKey("");
    const response = await getTeacherExamSubmissions(examId, scheduleId, page);
    applyResponse(response);
    await refreshPendingFinalizeCount();
    setLoadedRequestKey(requestKey);
  }, [
    applyResponse,
    examId,
    page,
    refreshPendingFinalizeCount,
    requestKey,
    scheduleId,
  ]);

  useEffect(() => {
    if (!scheduleId) return;
    let active = true;
    getTeacherExamSubmissions(examId, scheduleId, page)
      .then((response) => {
        if (!active) return;
        applyResponse(response);
        void refreshPendingFinalizeCount();
      })
      .catch(() => {
        if (active) toast.error("Không thể tải danh sách bài nộp.");
      })
      .finally(() => {
        if (active) setLoadedRequestKey(requestKey);
      });
    return () => {
      active = false;
    };
  }, [
    applyResponse,
    examId,
    page,
    refreshPendingFinalizeCount,
    requestKey,
    scheduleId,
  ]);

  const setPage = (nextPage: number) => {
    setPageSelection({ scheduleId, page: nextPage });
  };

  const release = async (next: typeof resultRelease) => {
    await updateTeacherResultRelease(examId, scheduleId, {
      mode: next.mode,
      releaseAt: next.releaseAt || null,
      published: next.published,
    });
    setResultRelease(next);
  };

  const markViolationsViewed = async (attemptId: string) => {
    await markTeacherSubmissionViolationsViewed(examId, scheduleId, attemptId);
    await reload();
  };

  const finalizeOne = async (attemptId: string, score: number, reason?: string) => {
    await finalizeTeacherSubmissionScore(examId, scheduleId, attemptId, score, reason);
    await reload();
  };

  /**
   * Lấy toàn bộ bài chưa chốt trong ca (không phân trang),
   * áp dụng scoreOverrides từ UI (user đã sửa trên bất kỳ trang nào),
   * và đánh dấu những bài có điểm thay đổi so với autoScore.
   * Dùng cho luồng "Chốt cả ca" để component biết ai cần nhập lý do.
   */
  const prepareFinalize = async (
    scoreOverrides: Record<string, string>,
  ): Promise<Array<{
    attemptId: string;
    studentCode: string;
    studentName: string;
    autoScore: number;
    score: number;
    isChanged: boolean;
    violationBlocked: boolean;
  }>> => {
    const allSubmissions = (
      await getAllTeacherExamSubmissions(examId, scheduleId)
    ).map(toExamSubmission);

    return allSubmissions
      .filter((s) => s.status !== "PUBLISHED")
      .map((s) => {
        const auto = s.autoScore ?? 0;
        const raw = scoreOverrides[s.attemptId];
        const score = raw !== undefined && raw !== "" ? Number(raw) : (s.finalScore ?? auto);
        const isChanged = Math.abs(score - auto) > 0.001;
        const violationBlocked = s.violationCount > 0 && !s.violationsViewed;
        return {
          attemptId: s.attemptId,
          studentCode: s.studentCode,
          studentName: s.studentName,
          autoScore: auto,
          score,
          isChanged,
          violationBlocked,
        };
      });
  };

  const finalizeMany = async (
    scoreOverrides: Array<{ attemptId: string; score: number; reason?: string }>,
  ) => {
    const overrideMap = new Map(
      scoreOverrides.map((item) => [item.attemptId, item]),
    );
    const allSubmissions = (
      await getAllTeacherExamSubmissions(examId, scheduleId)
    ).map(toExamSubmission);
    const readyToFinalize = allSubmissions.filter(
      (submission) => submission.status !== "PUBLISHED",
    );
    const blockedCount = readyToFinalize.filter(
      (submission) =>
        submission.violationCount > 0 && !submission.violationsViewed,
    ).length;
    if (blockedCount > 0) {
      throw Object.assign(new Error("VIOLATIONS_NOT_VIEWED"), { blockedCount });
    }
    const itemsToFinalize = readyToFinalize.map((submission) => {
      const override = overrideMap.get(submission.attemptId);
      return {
        attemptId: submission.attemptId,
        score: override?.score ?? submission.finalScore ?? submission.autoScore ?? 0,
        reason: override?.reason,
      };
    });
    if (!itemsToFinalize.length) return 0;
    await finalizeTeacherSubmissionScores(examId, scheduleId, itemsToFinalize);
    await reload();
    return itemsToFinalize.length;
  };

  return {
    items: scheduleId ? items : [],
    pagination: scheduleId ? pagination : EMPTY_PAGINATION,
    page,
    loading: Boolean(scheduleId) && loadedRequestKey !== requestKey,
    resultRelease,
    pendingFinalizeCount,
    setPage,
    release,
    reload,
    markViolationsViewed,
    finalizeOne,
    prepareFinalize,
    finalizeMany,
  };
}
