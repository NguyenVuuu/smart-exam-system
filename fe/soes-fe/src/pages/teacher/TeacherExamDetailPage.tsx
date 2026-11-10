import { useCallback, useMemo, useState } from "react";
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
  ViolationRecord,
} from "./types/teacher-exam.types";
import { copyTeacherExam, getTeacherExamViolations } from "./api/teacher-exams.api";
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
  // Ca dự phòng (nếu có) — load violations song song để hiển thị trong popup
  const anyMakeupSession = useMemo(
    () => visibleSessions.find((s) => s.makeupOfScheduleId === selectedSessionId),
    [visibleSessions, selectedSessionId],
  )
  const makeupViolationData = useTeacherExamViolations(
    anyMakeupSession?.examId ?? exam.id,
    selectedSessionClosed && violationLogVisible && anyMakeupSession ? anyMakeupSession.id : "",
  )
  // violationData merged với ca dự phòng để bảng submissions hiển thị badge đúng
  const mergedViolations = useMemo(
    () => [...violationData.items, ...makeupViolationData.items],
    [violationData.items, makeupViolationData.items],
  )
  const mergedViolationData = useMemo(
    () => ({
      ...violationData,
      items: mergedViolations,
    }),
    [violationData, mergedViolations],
  )
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
  const verificationKey = `${exam.id}:${exam.contentHash ?? ''}`;
  const [tamperedKey, setTamperedKey] = useState<string | null>(null);
  const [verifiedKey, setVerifiedKey] = useState<string | null>(null);
  const isTampered = tamperedKey === verificationKey;
  const hasVerified = verifiedKey === verificationKey;
  const onTamperedChange = useCallback(
    (tampered: boolean) => setTamperedKey(tampered ? verificationKey : null),
    [verificationKey],
  );
  const onVerifiedChange = useCallback(
    (verified: boolean) => setVerifiedKey(verified ? verificationKey : null),
    [verificationKey],
  );

  const requiresVerify = exam.status === "PUBLISHED";

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

  const [submissionViolations, setSubmissionViolations] = useState<ViolationRecord[]>([])
  const [sourceSubmissionViolations, setSourceSubmissionViolations] = useState<ViolationRecord[] | undefined>(undefined)

  const openSubmissionViolations = async (submission: ExamSubmission) => {
    try {
      await submissionData.markViolationsViewed(submission.attemptId)
      setViewingViolationSubmission({ ...submission, violationsViewed: true })
      setSourceSubmissionViolations(undefined)

      const scheduleId = submission.scheduleId
      const scheduleObj = visibleSessions.find((s) => s.id === scheduleId)
      const examIdForSchedule = scheduleObj?.examId ?? exam.id
      const pageSize = 500

      // Load violations của ca hiện tại — filter theo studentId để lấy đủ
      const data = await getTeacherExamViolations(examIdForSchedule, scheduleId, {
        page: 1, pageSize: 500, studentId: submission.studentId,
      })
      setSubmissionViolations(data.items.filter((v) => v.attemptId === submission.attemptId))

      // Nếu đây là ca dự phòng, load thêm violations ca gốc
      if (scheduleObj?.makeupOfScheduleId) {
        const sourceScheduleId = scheduleObj.makeupOfScheduleId
        // Ca gốc luôn thuộc exam.id (đề gốc)
        const sourceData = await getTeacherExamViolations(exam.id, sourceScheduleId, {
          page: 1, pageSize: 500, studentId: submission.studentId,
        })
        setSourceSubmissionViolations(sourceData.items)
      }
    } catch {
      toast.error("Không thể ghi nhận đã mở xem vi phạm.")
      setSubmissionViolations([])
      setSourceSubmissionViolations(undefined)
    }
  }

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
                onTamperedChange={onTamperedChange}
                onVerifiedChange={onVerifiedChange}
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
            ) : !isFinalManagementView ? (
              <ExamDetailTabs activeTab={activeTab} onChange={setActiveTab} />
            ) : null}

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
              makeupViolationData={isCourseSubmissionView ? makeupViolationData : undefined}
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
              onOpenMakeupModal={isCourseSubmissionView && selectedSessionClosed ? () => setIsMakeupModalOpen(true) : undefined}
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
        violations={submissionViolations}
        sourceViolations={sourceSubmissionViolations}
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
