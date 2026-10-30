import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ExamDetailBackButton } from "./components/exam-detail/ExamDetailBackButton";
import { ExamDetailHeader } from "./components/exam-detail/ExamDetailHeader";
import {
  ExamDetailTabs,
  type ExamDetailTab,
} from "./components/exam-detail/ExamDetailTabsNav";
import {
  CourseSubmissionHeader,
  CourseReviewTabs,
  type CourseReviewTab,
} from "./components/exam-detail/CourseExamReviewSection";
import { ExamDetailState } from "./components/exam-detail/ExamDetailState";
import { ExamRevisionNotice } from "./components/exam-detail/ExamRevisionNotice";
import ExamDetailTabContent from "./components/exam-detail/ExamDetailTabContent";
import ExamDetailDialogs from "./components/exam-detail/ExamDetailDialogs";
import TeacherSidebar from "./components/TeacherSidebar";
import TeacherTopBar from "./components/TeacherTopBar";
import type {
  Exam,
  ExamSchedule,
  ExamSubmission,
  ResultReleaseMode,
} from "./types/teacher-exam.types";
import { copyTeacherExam } from "./api/teacher-exams.api";
import { toast } from "sonner";
import { useTeacherExamDetail } from "./hooks/useTeacherExamDetail";
import { useTeacherExamSchedules } from "./hooks/useTeacherExamSchedules";
import { useTeacherExamSubmissions } from "./hooks/useTeacherExamSubmissions";
import { useTeacherExamViolations } from "./hooks/useTeacherExamViolations";
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
  const [isTampered, setIsTampered] = useState(false);
  const [hasVerified, setHasVerified] = useState(false);

  // Nếu đề có contentHash → bắt buộc verify trước khi tạo ca thi
  const requiresVerify = Boolean(exam.contentHash)

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

  const handleCopyExam = async () => {
    try {
      const copied = await copyTeacherExam(exam.id);
      toast.success("Đã sao chép đề thi thành công");
      navigate(`/teacher/exams/${copied.id}/edit`);
    } catch {
      toast.error("Không thể sao chép đề thi");
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
                onEdit={() =>
                  navigate(
                    `/teacher/exams/${exam.id}/edit${exam.status === "REJECTED" ? "?step=QUESTIONS" : ""}`,
                  )
                }
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
                onTamperedChange={setIsTampered}
                onVerifiedChange={setHasVerified}
              />
            )}

            <ExamRevisionNotice
              exam={exam}
              isCourseSubmissionView={isCourseSubmissionView}
            />

            {isCourseSubmissionView ? (
              <CourseReviewTabs
                activeTab={courseReviewTab}
                onChange={setCourseReviewTab}
              />
            ) : (
              <ExamDetailTabs activeTab={activeTab} onChange={setActiveTab} />
            )}

            <ExamDetailTabContent
              isFinalManagementView={isFinalManagementView}
              isCourseSubmissionView={isCourseSubmissionView}
              courseReviewTab={courseReviewTab}
              activeTab={activeTab}
              exam={exam}
              sessions={sessions}
              visibleSessions={visibleSessions}
              selectedSession={selectedSession}
              selectedSessionId={selectedSessionId}
              selectedSessionClosed={selectedSessionClosed}
              reviewUnavailableTitle={reviewUnavailableTitle}
              reviewUnavailableDescription={reviewUnavailableDescription}
              resultReleaseText={resultReleaseText}
              resultReleaseMode={resultReleaseMode}
              resultReleaseAt={resultReleaseAt}
              isResultsPublished={isResultsPublished}
              violationData={violationData}
              submissionData={submissionData}
              onSelectSession={setSelectedSessionId}
              onViewEvidence={setSelectedEvidenceUrl}
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
              onChangeResultReleaseMode={changeResultReleaseMode}
              onOpenMakeupModal={() => setIsMakeupModalOpen(true)}
              onViewSubmission={setViewingSubmission}
              onViewViolations={(submission) =>
                void openSubmissionViolations(submission)
              }
              isTampered={isTampered}
              isVerifyRequired={requiresVerify && !hasVerified}
            />
          </div>
        </main>
      </div>

      <ExamDetailDialogs
        exam={exam}
        selectedEvidenceUrl={selectedEvidenceUrl}
        onCloseEvidence={() => setSelectedEvidenceUrl(null)}
        onViewEvidence={setSelectedEvidenceUrl}
        viewingSubmission={viewingSubmission}
        onCloseViewingSubmission={() => setViewingSubmission(null)}
        viewingViolationSubmission={viewingViolationSubmission}
        onCloseViolationSubmission={() => setViewingViolationSubmission(null)}
        violations={violationData.items}
        isPreviewOpen={isPreviewOpen}
        onClosePreview={() => setIsPreviewOpen(false)}
        isMakeupModalOpen={isMakeupModalOpen}
        onCloseMakeupModal={() => setIsMakeupModalOpen(false)}
        submissions={submissionData.items}
        selectedSession={selectedSession}
        examDefaults={examDefaults}
        onRefresh={onRefresh}
        onReloadSubmissions={submissionData.reload}
        isAssignModalOpen={isAssignModalOpen}
        onCloseAssignModal={() => {
          setIsAssignModalOpen(false);
          setEditingSession(null);
        }}
        editingSession={editingSession}
        courses={courses}
        resultReleaseMode={resultReleaseMode}
        resultReleaseAt={resultReleaseAt}
        saveSchedule={saveSchedule}
        setSelectedSessionId={setSelectedSessionId}
        setActiveTab={setActiveTab}
        viewingSession={viewingSession}
        onCloseViewingSession={() => setViewingSession(null)}
        cancellingSession={cancellingSession}
        onCloseCancellingSession={() => setCancellingSession(null)}
        cancelSchedule={cancelSchedule}
        distributionLock={distributionLock}
      />
    </div>
  );
}
