import { ShieldAlert, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  EvidenceImageModal,
  ExamPreviewModal,
  StudentSubmissionReviewModal,
} from "./components/exam-detail/ExamDetailModals";
import ExamSessionsTab from "./components/exam-detail/ExamSessionsTab";
import AssignExamToCourseModal from "./components/exam-detail/AssignExamToCourseModal";
import ExamSessionDetailModal from "./components/exam-detail/session/ExamSessionDetailModal";
import { ExamDetailBackButton } from "./components/exam-detail/ExamDetailBackButton";
import { ExamDetailHeader } from "./components/exam-detail/ExamDetailHeader";
import {
  ExamDetailTabs,
  type ExamDetailTab,
} from "./components/exam-detail/ExamDetailTabsNav";
import {
  CourseSubmissionHeader,
  CourseReviewTabs,
  CourseReviewUnavailable,
  CourseViolationLog,
  type CourseReviewTab,
} from "./components/exam-detail/CourseExamReviewSection";
import { ExamOverviewTab } from "./components/exam-detail/ExamOverviewTab";
import { ExamProctoringTab } from "./components/exam-detail/ExamProctoringTab";
import { ExamSubmissionsTab } from "./components/exam-detail/ExamSubmissionsTab";
import TeacherSidebar from "./components/TeacherSidebar";
import TeacherTopBar from "./components/TeacherTopBar";
import type {
  Exam,
  ExamSchedule,
  ExamSubmission,
  ResultReleaseMode,
  ViolationRecord,
} from "./types/teacher-exam.types";
import {
  copyTeacherExam,
  createTeacherMakeupSchedule,
} from "./api/teacher-exams.api";
import { toast } from "sonner";
import { useTeacherExamDetail } from "./hooks/useTeacherExamDetail";
import { useTeacherExamSchedules } from "./hooks/useTeacherExamSchedules";
import CancelTeacherScheduleDialog from "./components/exam-detail/CancelTeacherScheduleDialog";
import { useTeacherExamSubmissions } from "./hooks/useTeacherExamSubmissions";
import { useTeacherExamViolations } from "./hooks/useTeacherExamViolations";
import ExamDistributionLockDialog from "./components/exam-detail/ExamDistributionLockDialog";
import { useExamDistributionLock } from "./hooks/useExamDistributionLock";
import { useExamStudentVisibility } from "./hooks/useExamStudentVisibility";
import { useTeacherExamDefaults } from "./hooks/useTeacherExamDefaults";

const isClosedSession = (session?: ExamSchedule | null) =>
  Boolean(
    session &&
    (session.status === "CLOSED" ||
      (session.endTime && new Date(session.endTime) <= new Date())),
  );

export default function TeacherExamDetailPage({
  mode = "management",
}: {
  mode?: "management" | "course-submissions";
}) {
  const { examId, courseOfferingId } = useParams<{
    examId: string;
    courseOfferingId?: string;
  }>();
  const { exam, loading, error, retry } = useTeacherExamDetail(examId);

  if (loading) return <ExamDetailState message="Đang tải đề thi..." />;
  if (!exam)
    return (
      <ExamDetailState
        message={error ?? "Không tìm thấy đề thi."}
        onRetry={() => void retry()}
      />
    );
  return (
    <TeacherExamDetailContent
      key={`${mode}-${exam.id}-${courseOfferingId ?? ""}`}
      exam={exam}
      onRefresh={retry}
      mode={mode}
      courseOfferingId={courseOfferingId}
    />
  );
}

function TeacherExamDetailContent({
  exam,
  onRefresh,
  mode,
  courseOfferingId,
}: {
  exam: Exam;
  onRefresh: () => Promise<void>;
  mode: "management" | "course-submissions";
  courseOfferingId?: string;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const examDefaults = useTeacherExamDefaults();
  const isCourseSubmissionView = mode === "course-submissions";
  const initialTab =
    isCourseSubmissionView || searchParams.get("tab") === "submissions"
      ? "submissions"
      : "sessions";
  const [activeTab, setActiveTab] = useState<ExamDetailTab>(initialTab);
  const [courseReviewTab, setCourseReviewTab] =
    useState<CourseReviewTab>("submissions");
  const {
    schedules: sessions,
    courses,
    loading: schedulesLoading,
    save: saveSchedule,
    cancel: cancelSchedule,
  } = useTeacherExamSchedules(exam.id, exam.subjectId);
  const [requestedSessionId, setSelectedSessionId] = useState(
    searchParams.get("scheduleId") ??
      searchParams.get("scheduledId") ??
      (exam.schedules ?? [])[0]?.id ??
      "",
  );
  const isFinalManagementView =
    !isCourseSubmissionView && exam.category === "FINAL";
  const visibleSessions = useMemo(
    () =>
      isCourseSubmissionView && courseOfferingId
        ? sessions.filter(
            (session) =>
              session.courseOfferingId === courseOfferingId ||
              session.courseOfferings?.some(
                (course) => course.id === courseOfferingId,
              ),
          )
        : sessions,
    [courseOfferingId, isCourseSubmissionView, sessions],
  );
  const selectedSessionId = visibleSessions.some(
    (session) => session.id === requestedSessionId,
  )
    ? requestedSessionId
    : (visibleSessions[0]?.id ?? "");
  const selectedSession = visibleSessions.find(
    (session) => session.id === selectedSessionId,
  );
  const selectedCourseCode = courseOfferingId
    ? selectedSession?.courseOfferings?.find(
        (course) => course.id === courseOfferingId,
      )?.code
    : selectedSession?.courseCode;
  const selectedSessionClosed = isClosedSession(selectedSession);
  const submissionData = useTeacherExamSubmissions(
    exam.id,
    selectedSessionClosed ? selectedSessionId : "",
  );
  const violationLogVisible =
    selectedSessionClosed ||
    (isCourseSubmissionView
      ? courseReviewTab === "violations"
      : activeTab === "proctoring");
  const violationData = useTeacherExamViolations(
    exam.id,
    selectedSessionClosed && violationLogVisible ? selectedSessionId : "",
  );
  const hasVisibleSession = visibleSessions.length > 0;
  const reviewUnavailableTitle = schedulesLoading
    ? "Đang tải ca thi"
    : hasVisibleSession
      ? "Ca thi chưa kết thúc"
      : "Không tìm thấy ca thi của lớp";
  const reviewUnavailableDescription = hasVisibleSession
    ? "Bài nộp, kết quả và nhật ký vi phạm chỉ được mở sau khi ca thi kết thúc."
    : "Lớp học phần này chưa được gán vào ca thi hoặc bạn không phụ trách lớp.";
  const {
    mode: resultReleaseMode,
    releaseAt: resultReleaseAt,
    published: isResultsPublished,
  } = submissionData.resultRelease;
  const [viewingSubmission, setViewingSubmission] =
    useState<ExamSubmission | null>(null);
  const [viewingViolationSubmission, setViewingViolationSubmission] =
    useState<ExamSubmission | null>(null);
  const [selectedEvidenceUrl, setSelectedEvidenceUrl] = useState<string | null>(
    null,
  );
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isMakeupModalOpen, setIsMakeupModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<ExamSchedule | null>(
    null,
  );
  const [viewingSession, setViewingSession] = useState<ExamSchedule | null>(
    null,
  );
  const [cancellingSession, setCancellingSession] =
    useState<ExamSchedule | null>(null);
  const distributionLock = useExamDistributionLock(exam.id, onRefresh);
  const studentVisibility = useExamStudentVisibility(exam.id, onRefresh);

  const resultReleaseText =
    resultReleaseMode === "IMMEDIATE"
      ? "Sinh viên thấy điểm ngay sau khi nộp bài"
      : resultReleaseMode === "SCHEDULED"
        ? `Tự động công bố điểm lúc ${resultReleaseAt}`
        : isResultsPublished
          ? "Đã công bố điểm thủ công cho sinh viên"
          : "Đang ẩn điểm, giảng viên sẽ công bố sau";

  const changeResultReleaseMode = (mode: ResultReleaseMode) => {
    void submissionData
      .release({
        mode,
        releaseAt: mode === "SCHEDULED" ? resultReleaseAt : "",
        published: mode === "IMMEDIATE",
      })
      .catch(() => toast.error("Không thể cập nhật cấu hình công bố điểm."));
  };

  const openSubmissionViolations = async (submission: ExamSubmission) => {
    try {
      await submissionData.markViolationsViewed(submission.attemptId);
      setViewingViolationSubmission({ ...submission, violationsViewed: true });
    } catch {
      toast.error("Không thể ghi nhận đã mở xem vi phạm.");
    }
  };

  const selectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };

  const handleCopyExam = async () => {
    try {
      const copied = await copyTeacherExam(exam.id);
      toast.success("Đã sao chép đề thi thành công");
      navigate(`/teacher/exams/${copied.id}/edit`);
    } catch {
      toast.error("Không thể sao chép đề thi");
    }
  };

  const renderActiveTab = () => {
    if (isFinalManagementView) return null;

    if (isCourseSubmissionView && courseReviewTab === "violations") {
      return selectedSessionClosed ? (
        <CourseViolationLog
          violations={violationData.items}
          pagination={violationData.pagination}
          loading={violationData.loading}
          error={violationData.error}
          onPageChange={violationData.setPage}
          onRefresh={violationData.reload}
          onViewEvidence={setSelectedEvidenceUrl}
        />
      ) : (
        <CourseReviewUnavailable
          title={reviewUnavailableTitle}
          description={reviewUnavailableDescription}
        />
      );
    }

    switch (activeTab) {
      case "sessions": {
        const isFinalExam = exam.category === "FINAL";
        const canManageSchedules =
          !isFinalExam && Boolean(exam.capabilities?.canSchedule);
        return (
          <ExamSessionsTab
            sessions={sessions}
            onCreateSession={() => {
              setEditingSession(null);
              setIsAssignModalOpen(true);
            }}
            onViewSession={(session) => setViewingSession(session)}
            onEditSession={(session) => {
              setEditingSession(session);
              setIsAssignModalOpen(true);
            }}
            onDeleteSession={(sessionId) => {
              const targetSession = sessions.find((s) => s.id === sessionId);
              if (targetSession) setCancellingSession(targetSession);
            }}
            canCreate={canManageSchedules}
          />
        );
      }
      case "overview":
        return (
          <ExamOverviewTab exam={exam} resultReleaseText={resultReleaseText} />
        );
      case "proctoring":
        return (
          <ExamProctoringTab
            violations={violationData.items}
            sessions={sessions}
            selectedSessionId={selectedSessionId}
            onSessionChange={selectSession}
            onViewEvidence={setSelectedEvidenceUrl}
            pagination={violationData.pagination}
            loading={violationData.loading}
            error={violationData.error}
            onPageChange={violationData.setPage}
            onRefresh={violationData.reload}
          />
        );
      case "submissions":
      default:
        return (
          <>
            {selectedSessionClosed &&
              !isCourseSubmissionView &&
              selectedSession && (
                <div className="mb-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsMakeupModalOpen(true)}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    Tạo ca dự phòng
                  </button>
                </div>
              )}
            <ExamSubmissionsTab
              submissions={submissionData.items}
              sessions={visibleSessions}
              selectedSessionId={selectedSessionId}
              onSessionChange={selectSession}
              resultReleaseText={resultReleaseText}
              resultReleaseMode={resultReleaseMode}
              resultReleaseAt={resultReleaseAt}
              isResultsPublished={isResultsPublished}
              onResultReleaseModeChange={changeResultReleaseMode}
              onResultReleaseAtChange={(at) =>
                void submissionData.release({
                  mode: resultReleaseMode,
                  releaseAt: at,
                  published: isResultsPublished,
                })
              }
              onResultsPublishedChange={(pub) =>
                void submissionData.release({
                  mode: resultReleaseMode,
                  releaseAt: resultReleaseAt,
                  published: pub,
                })
              }
              onViewSubmission={setViewingSubmission}
              onViewViolations={(submission) =>
                void openSubmissionViolations(submission)
              }
              onFinalizeOne={async (submission, score) => {
                await submissionData.finalizeOne(submission.attemptId, score);
              }}
              onFinalizeAll={submissionData.finalizeMany}
              pendingFinalizeCount={submissionData.pendingFinalizeCount}
              loading={submissionData.loading}
              pagination={submissionData.pagination}
              onPageChange={submissionData.setPage}
              canReview={selectedSessionClosed}
              showSessionSelector={!isCourseSubmissionView}
              unavailableTitle={reviewUnavailableTitle}
              unavailableDescription={reviewUnavailableDescription}
            />
          </>
        );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">
      <TeacherSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TeacherTopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl space-y-6">
            <ExamDetailBackButton
              onBack={() => navigate("/teacher/exams")}
              label={
                isCourseSubmissionView
                  ? "Quay lại danh sách bài thi"
                  : "Quay lại quản lý đề thi"
              }
            />

            {isCourseSubmissionView ? (
              <CourseSubmissionHeader
                exam={exam}
                courseCode={selectedCourseCode}
              />
            ) : (
              <ExamDetailHeader
                exam={exam}
                onEdit={() => navigate(`/teacher/exams/${exam.id}/edit`)}
                onPublish={() => void 0}
                onPreview={() => setIsPreviewOpen(true)}
                onCopy={() => void handleCopyExam()}
                onToggleStudentVisibility={() =>
                  void studentVisibility.update(
                    exam.studentVisibility === "VISIBLE" ? "HIDDEN" : "VISIBLE",
                  )
                }
                onLockDistribution={distributionLock.requestLock}
                onUnlockDistribution={distributionLock.requestUnlock}
                visibilitySaving={studentVisibility.saving}
              />
            )}

            {isCourseSubmissionView ? (
              <CourseReviewTabs
                activeTab={courseReviewTab}
                onChange={setCourseReviewTab}
              />
            ) : (
              <ExamDetailTabs activeTab={activeTab} onChange={setActiveTab} />
            )}

            {renderActiveTab()}
          </div>
        </main>
      </div>

      <EvidenceImageModal
        imageUrl={selectedEvidenceUrl}
        onClose={() => setSelectedEvidenceUrl(null)}
      />
      <StudentSubmissionReviewModal
        exam={exam}
        submission={viewingSubmission}
        onClose={() => setViewingSubmission(null)}
      />
      <SubmissionViolationsModal
        submission={viewingViolationSubmission}
        violations={violationData.items.filter(
          (violation) =>
            violation.attemptId === viewingViolationSubmission?.attemptId,
        )}
        onClose={() => setViewingViolationSubmission(null)}
        onViewEvidence={setSelectedEvidenceUrl}
      />
      <ExamPreviewModal
        exam={exam}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
      <MakeupScheduleModal
        isOpen={isMakeupModalOpen}
        submissions={submissionData.items}
        defaultDurationMinutes={
          selectedSession?.durationMinutes ?? exam.defaultDurationMinutes
        }
        onClose={() => setIsMakeupModalOpen(false)}
        onCreate={async (input) => {
          if (!selectedSession) return;
          await createTeacherMakeupSchedule(exam.id, selectedSession.id, {
            courseOfferingId:
              selectedSession.courseOfferingId ||
              selectedSession.courseOfferings?.[0]?.id ||
              "",
            startTime: input.startTime,
            endTime: input.endTime,
            durationMinutes: input.durationMinutes,
            maxAttempts: 1,
            password: input.password,
            resultReleaseMode: "MANUAL",
            resultReleaseAt: null,
            allowStudentReview: false,
            enableTabLock:
              selectedSession.enableTabLock ?? examDefaults.enableTabLock,
            requireFullscreen:
              selectedSession.requireFullscreen ??
              examDefaults.requireFullscreen,
            enableWebcam:
              selectedSession.enableWebcam ?? examDefaults.enableWebcam,
            enableScreenMonitoring:
              selectedSession.enableScreenMonitoring ??
              examDefaults.enableScreenMonitoring,
            blockCopyPaste:
              selectedSession.blockCopyPaste ?? examDefaults.blockCopyPaste,
            blockRightClick:
              selectedSession.blockRightClick ?? examDefaults.blockRightClick,
            locationMode: "ONLINE",
            allowedIpRanges: [],
            distributionMode: "SHUFFLE_QUESTIONS_AND_OPTIONS",
            randomQuestionCount: null,
            studentIds: input.studentIds,
          });
          await onRefresh();
          await submissionData.reload();
          setIsMakeupModalOpen(false);
          toast.success("Đã tạo ca thi dự phòng.");
        }}
      />
      <AssignExamToCourseModal
        isOpen={isAssignModalOpen}
        examId={exam.id}
        subjectName={exam.subjectName}
        courses={courses}
        onClose={() => {
          setIsAssignModalOpen(false);
          setEditingSession(null);
        }}
        examTitle={exam.title}
        defaultConfig={{
          durationMinutes:
            editingSession?.durationMinutes ?? exam.defaultDurationMinutes,
          maxAttempts: editingSession?.maxAttempts ?? 1,
          password: editingSession?.password ?? "",
          resultReleaseMode:
            editingSession?.resultReleaseMode ?? resultReleaseMode,
          resultReleaseAt: (
            editingSession?.resultReleaseAt ?? resultReleaseAt
          ).replace(" ", "T"),
          allowStudentReview: editingSession?.allowStudentReview ?? false,
          enableTabLock:
            editingSession?.enableTabLock ?? examDefaults.enableTabLock,
          requireFullscreen:
            editingSession?.requireFullscreen ?? examDefaults.requireFullscreen,
          enableWebcam:
            editingSession?.enableWebcam ?? examDefaults.enableWebcam,
          enableScreenMonitoring:
            editingSession?.enableScreenMonitoring ??
            examDefaults.enableScreenMonitoring,
          blockCopyPaste:
            editingSession?.blockCopyPaste ?? examDefaults.blockCopyPaste,
          blockRightClick:
            editingSession?.blockRightClick ?? examDefaults.blockRightClick,
          ipMode: editingSession?.ipMode ?? "HOME",
          allowedIpRange: editingSession?.allowedIpRange,
          distributionMode:
            editingSession?.distributionMode ?? "SHUFFLE_QUESTIONS_AND_OPTIONS",
        }}
        initialSessions={editingSession ? [editingSession] : undefined}
        initialEditingSessionId={editingSession?.id}
        onCreateSessions={async (newSessions) => {
          const saved = await Promise.all(
            newSessions.map((session) =>
              saveSchedule(session, editingSession?.id),
            ),
          );
          await onRefresh();
          setSelectedSessionId((current) => current || saved[0]?.id || "");
          setActiveTab("sessions");
          toast.success(
            editingSession ? "Đã cập nhật ca thi." : "Đã tạo ca thi.",
          );
        }}
      />
      <ExamSessionDetailModal
        session={viewingSession}
        onClose={() => setViewingSession(null)}
      />
      <CancelTeacherScheduleDialog
        key={cancellingSession?.id ?? "closed-schedule-dialog"}
        schedule={cancellingSession}
        onClose={() => setCancellingSession(null)}
        onConfirm={async (reason) => {
          if (!cancellingSession) return;
          await cancelSchedule(cancellingSession.id, reason);
          await onRefresh();
          setCancellingSession(null);
          toast.success("Đã hủy ca thi.");
        }}
      />
      <ExamDistributionLockDialog
        action={distributionLock.action}
        saving={distributionLock.saving}
        onClose={distributionLock.close}
        onConfirm={() => void distributionLock.confirm()}
      />
    </div>
  );
}

function ExamDetailState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">
      <TeacherSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TeacherTopBar />
        <main className="grid flex-1 place-items-center p-6">
          <div className="text-center">
            <h1 className="text-lg font-semibold text-gray-900">{message}</h1>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Thử lại
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function toLocalInputValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function MakeupScheduleModal({
  isOpen,
  submissions,
  defaultDurationMinutes,
  onClose,
  onCreate,
}: {
  isOpen: boolean;
  submissions: ExamSubmission[];
  defaultDurationMinutes: number;
  onClose: () => void;
  onCreate: (input: {
    studentIds: string[];
    startTime: string;
    endTime: string;
    durationMinutes: number;
    password?: string | null;
  }) => Promise<void>;
}) {
  const defaultStart = new Date(Date.now() + 30 * 60 * 1000);
  const defaultEnd = new Date(
    defaultStart.getTime() + defaultDurationMinutes * 60 * 1000,
  );
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [startTime, setStartTime] = useState(toLocalInputValue(defaultStart));
  const [endTime, setEndTime] = useState(toLocalInputValue(defaultEnd));
  const [durationMinutes, setDurationMinutes] = useState(
    defaultDurationMinutes,
  );
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const toggleStudent = (studentId: string) => {
    setStudentIds((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId],
    );
  };

  const submit = async () => {
    if (!studentIds.length) {
      toast.warning("Chọn ít nhất một sinh viên làm ca dự phòng.");
      return;
    }
    if (new Date(endTime) <= new Date(startTime)) {
      toast.error("Thời gian kết thúc phải sau thời gian bắt đầu.");
      return;
    }
    setSaving(true);
    try {
      await onCreate({
        studentIds,
        startTime,
        endTime,
        durationMinutes,
        password: password.trim() || null,
      });
    } catch {
      toast.error("Không thể tạo ca thi dự phòng.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Tạo ca thi dự phòng
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Chỉ sinh viên được chọn mới thấy và vào được ca này.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold text-gray-700">
              Bắt đầu
              <input
                type="datetime-local"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm"
              />
            </label>
            <label className="text-sm font-semibold text-gray-700">
              Kết thúc
              <input
                type="datetime-local"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm"
              />
            </label>
            <label className="text-sm font-semibold text-gray-700">
              Thời lượng làm bài
              <input
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(event) =>
                  setDurationMinutes(Number(event.target.value))
                }
                className="mt-2 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm"
              />
            </label>
            <label className="text-sm font-semibold text-gray-700">
              Mật khẩu ca thi
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm"
                placeholder="Không bắt buộc"
              />
            </label>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-900">
              Sinh viên được làm lại
            </p>
            <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-gray-100">
              {submissions.map((submission) => (
                <label
                  key={submission.studentId}
                  className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-3 text-sm last:border-b-0 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={studentIds.includes(submission.studentId)}
                    onChange={() => toggleStudent(submission.studentId)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="font-semibold text-gray-900">
                    {submission.studentCode}
                  </span>
                  <span className="text-gray-600">
                    {submission.studentName}
                  </span>
                  {!submission.hasSubmitted && (
                    <span className="ml-auto rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                      Không nộp
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="min-h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={saving}
            className="min-h-10 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Đang tạo..." : "Tạo ca dự phòng"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SubmissionViolationsModal({
  submission,
  violations,
  onClose,
  onViewEvidence,
}: {
  submission: ExamSubmission | null;
  violations: ViolationRecord[];
  onClose: () => void;
  onViewEvidence: (url: string) => void;
}) {
  if (!submission) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
              <ShieldAlert size={20} />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-gray-900">
                Vi phạm của {submission.studentName}
              </h3>
              <p className="text-sm text-gray-500">
                {submission.studentCode} - {submission.violationCount} sự kiện
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {violations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 px-5 py-10 text-center text-sm text-gray-500">
              Chưa tải được chi tiết vi phạm. Hãy mở tab Nhật ký vi phạm nếu cần
              xem toàn bộ lịch sử.
            </div>
          ) : (
            <div className="space-y-3">
              {violations.map((violation) => (
                <div
                  key={violation.id}
                  className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {violation.type}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(violation.timestamp).toLocaleString("vi-VN")}{" "}
                        - Mức độ {violation.severity}
                      </p>
                      {violation.note && (
                        <p className="mt-2 text-sm text-gray-600">
                          {violation.note}
                        </p>
                      )}
                    </div>
                    {violation.evidenceImageUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          onViewEvidence(violation.evidenceImageUrl!)
                        }
                        className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        Xem bằng chứng
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
